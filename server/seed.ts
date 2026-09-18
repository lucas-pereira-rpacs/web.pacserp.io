import fs from 'node:fs/promises';
import bcrypt from 'bcrypt';
import { Permission } from '#enumerators/permission';
import logger from '#loggers';
import { RoleModel } from '#models/role';
import { RolePermissionModel } from '#models/rolePermission';
import { SystemModel } from '#models/system';
import { UserModel } from '#models/user';
import { UserRoleModel } from '#models/userRole';
import storageClient from '#storage/client';

const SALT_ROUNDS = 12;

export async function ensureInitialRoles() {
  const [adminResult, rootResult] = await Promise.all([
    RoleModel.updateOne({ name: 'admin' }, { $setOnInsert: { name: 'admin' } }, { upsert: true }),
    RoleModel.updateOne({ name: 'root' }, { $setOnInsert: { name: 'root' } }, { upsert: true }),
  ]);

  const created: string[] = [];
  if (adminResult.upsertedCount > 0) {
    created.push('admin');
  }
  if (rootResult.upsertedCount > 0) {
    created.push('root');
  }

  logger.info('Initial roles ensured', { created });
}

export async function ensureInitialPermissions() {
  const [adminRole, rootRole] = await Promise.all([
    RoleModel.findOne({ name: 'admin' }).orFail(),
    RoleModel.findOne({ name: 'root' }).orFail(),
  ]);
  const adminPermissions = [
    Permission.UsersRead,
    Permission.UsersCreate,
    Permission.UsersUpdate,
    Permission.UsersDelete,
    Permission.RolesRead,
  ];
  const assignments = adminPermissions.map((permission) => ({
    role_id: adminRole._id,
    permission,
  }));

  await RolePermissionModel.syncIndexes();
  await RolePermissionModel.deleteMany({ permission: { $nin: Object.values(Permission) } });
  await RolePermissionModel.deleteMany({ role_id: rootRole._id });
  const result = await RolePermissionModel.bulkWrite(
    assignments.map((assignment) => ({
      updateOne: {
        filter: assignment,
        update: { $setOnInsert: assignment },
        upsert: true,
      },
    })),
  );

  logger.info('Initial permissions ensured', { created: result.upsertedCount });
}

export async function ensureInitialUsers() {
  const rootEmail = process.env.ROOT_EMAIL?.trim().toLowerCase();
  const rootPassword = process.env.ROOT_PASSWORD;
  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!rootEmail || !rootPassword) {
    throw new Error('ROOT_EMAIL and ROOT_PASSWORD must be set');
  }

  if (!adminEmail || !adminPassword) {
    throw new Error('ADMIN_EMAIL and ADMIN_PASSWORD must be set');
  }

  const created: string[] = [];
  let rootUser = await UserModel.findOne({ email: rootEmail });
  if (!rootUser) {
    rootUser = await UserModel.create({
      email: rootEmail,
      fullName: 'Root',
      isVerified: true,
      passwordHash: await bcrypt.hash(rootPassword, SALT_ROUNDS),
    });
    created.push('root');
  }
  if (!rootUser.isVerified) {
    rootUser.isVerified = true;
    await rootUser.save();
  }

  const rootRole = await RoleModel.findOne({ name: 'root' }).orFail();
  await UserRoleModel.updateOne(
    { userId: rootUser._id, roleId: rootRole._id },
    { $setOnInsert: { userId: rootUser._id, roleId: rootRole._id } },
    { upsert: true },
  );

  let adminUser = await UserModel.findOne({ email: adminEmail });
  if (!adminUser) {
    adminUser = await UserModel.create({
      email: adminEmail,
      fullName: 'Admin',
      isVerified: true,
      passwordHash: await bcrypt.hash(adminPassword, SALT_ROUNDS),
    });
    created.push('admin');
  }
  if (!adminUser.isVerified) {
    adminUser.isVerified = true;
    await adminUser.save();
  }

  const adminRole = await RoleModel.findOne({ name: 'admin' }).orFail();
  await UserRoleModel.updateOne(
    { userId: adminUser._id, roleId: adminRole._id },
    { $setOnInsert: { userId: adminUser._id, roleId: adminRole._id } },
    { upsert: true },
  );

  logger.info('Initial users ensured', { created });
}

export async function ensureInitialSystem() {
  let systemName = process.env.SYSTEM_NAME;
  let systemSlogan = process.env.SYSTEM_SLOGAN;

  if (!systemName) {
    systemName = 'Web Base';
  }

  if (!systemSlogan) {
    systemSlogan = 'A clean foundation for web applications';
  }

  const systemResult = await SystemModel.updateOne(
    {},
    { $setOnInsert: { name: systemName, slogan: systemSlogan, features: [] } },
    { upsert: true },
  );
  await SystemModel.updateOne({ slogan: { $exists: false } }, { $set: { slogan: systemSlogan } });
  await SystemModel.updateOne({ features: { $exists: false } }, { $set: { features: [] } });

  logger.info('Initial system ensured', { created: systemResult.upsertedCount > 0 });
}

export async function ensureInitialContainers() {
  const systemContainer = storageClient.getContainerClient('system');
  const publicContainer = storageClient.getContainerClient('public');
  const [systemResult, publicResult] = await Promise.all([
    systemContainer.createIfNotExists({ access: 'blob' }),
    publicContainer.createIfNotExists({ access: 'blob' }),
  ]);

  const created: string[] = [];
  if (systemResult.succeeded) {
    created.push('system');
  }
  if (publicResult.succeeded) {
    created.push('public');
  }

  logger.info('Initial storage containers ensured', { created });
}

export async function ensureLogo() {
  const container = storageClient.getContainerClient('system');
  const blob = container.getBlockBlobClient('logo');

  if (await blob.exists()) {
    logger.info('Logo ensured', { created: false });
    return;
  }

  const logo = await fs.readFile('./public/logo.svg');
  await blob.uploadData(logo, {
    blobHTTPHeaders: { blobContentType: 'image/svg+xml' },
  });

  logger.info('Logo ensured', { created: true });
}

export async function ensurePlaceholder() {
  const container = storageClient.getContainerClient('system');
  const blob = container.getBlockBlobClient('placeholder');

  if (await blob.exists()) {
    logger.info('Placeholder ensured', { created: false });
    return;
  }

  const placeholder = await fs.readFile('./public/placeholder.jpg');
  await blob.uploadData(placeholder, {
    blobHTTPHeaders: { blobContentType: 'image/jpeg' },
  });

  logger.info('Placeholder ensured', { created: true });
}

export default async function seed() {
  logger.info('Database seeding started');
  await ensureInitialRoles();
  await ensureInitialPermissions();
  await ensureInitialUsers();
  await ensureInitialSystem();
  await ensureInitialContainers();
  await ensureLogo();
  await ensurePlaceholder();
  logger.info('Database seeding completed');
}
