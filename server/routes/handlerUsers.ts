import bcrypt from 'bcrypt';
import { isValidObjectId } from 'mongoose';
import { Router } from 'express';
import { z } from 'zod';
import { Permission } from '#enumerators/permission';
import mustHavePermissions from '#middlewares/mustHavePermissions';
import { RoleModel } from '#models/role';
import { RolePermissionModel } from '#models/rolePermission';
import { UserModel } from '#models/user';
import { UserRoleModel } from '#models/userRole';
import problem from '#problem';

const SALT_ROUNDS = 12;
const router = Router();

const userInput = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email().max(254)),
  fullName: z.string().trim().min(1, 'Full name is required').max(100),
  phoneNumber: z.string().trim().max(50).optional(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .refine((password) => Buffer.byteLength(password, 'utf8') <= 72, {
      error: 'Password must be at most 72 bytes',
    }),
  roles: z.array(z.string().trim().min(1).max(50)).max(100).default([]),
});

const userUpdateInput = userInput.extend({ password: userInput.shape.password.optional() });

router.get('/', mustHavePermissions(Permission.UsersRead), async (_req, res) => {
  const users = await UserModel.find().sort({ fullName: 1, email: 1 });
  const userIds = users.map((user) => user._id);
  const userRoles = await UserRoleModel.find({ userId: { $in: userIds } });
  const roleIds = userRoles.map((userRole) => userRole.roleId);
  const roles = await RoleModel.find({ _id: { $in: roleIds } }).select('name');
  const roleNames = new Map(roles.map((role) => [role.id, role.name]));
  const rolePermissions = await RolePermissionModel.find({ role_id: { $in: roleIds } });

  res.json({
    users: users.map((user) => {
      const assignedRoleIds = userRoles
        .filter((userRole) => userRole.userId.equals(user._id))
        .map((userRole) => userRole.roleId.toString());
      const assignedRoles = assignedRoleIds
        .map((roleId) => roleNames.get(roleId))
        .filter((role): role is string => Boolean(role));
      let permissions = [
        ...new Set(
          rolePermissions
            .filter((rolePermission) => assignedRoleIds.includes(rolePermission.role_id.toString()))
            .map((rolePermission) => rolePermission.permission),
        ),
      ];
      if (assignedRoles.includes('root')) {
        permissions = Object.values(Permission);
      }

      return {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        phoneNumber: user.phoneNumber,
        isVerified: user.isVerified,
        roles: assignedRoles,
        permissions,
      };
    }),
  });
});

router.get('/:id', mustHavePermissions(Permission.UsersRead), async (req, res) => {
  if (!isValidObjectId(req.params.id)) {
    problem(req, res, 404, 'User not found');
    return;
  }

  const user = await UserModel.findById(req.params.id);
  if (!user) {
    problem(req, res, 404, 'User not found');
    return;
  }

  const userRoles = await UserRoleModel.find({ userId: user._id }).select('roleId');
  const roleIds = userRoles.map((userRole) => userRole.roleId);
  const roles = await RoleModel.find({ _id: { $in: roleIds } }).select('name');
  let permissions = await RolePermissionModel.distinct('permission', {
    role_id: { $in: roleIds },
  });
  if (roles.some((role) => role.name === 'root')) {
    permissions = Object.values(Permission);
  }

  res.json({
    user: {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      phoneNumber: user.phoneNumber,
      isVerified: user.isVerified,
      roles: roles.map((role) => role.name),
      permissions,
    },
  });
});

router.post('/', mustHavePermissions(Permission.UsersCreate), async (req, res) => {
  const input = userInput.safeParse(req.body);
  if (!input.success) {
    problem(req, res, 400, input.error.issues[0]?.message ?? 'Invalid request');
    return;
  }

  const rootRole = await RoleModel.findOne({ name: 'root' }).select('_id');
  let isRoot = false;
  if (rootRole) {
    isRoot = Boolean(await UserRoleModel.exists({ userId: req.user!.id, roleId: rootRole._id }));
  }
  if (!isRoot && input.data.roles.includes('root')) {
    problem(req, res, 403, 'Only root users can grant the root role');
    return;
  }

  const requestedRoles = [...new Set(input.data.roles)];
  const roles = await RoleModel.find({ name: { $in: requestedRoles } }).select('_id name');
  if (roles.length !== requestedRoles.length) {
    problem(req, res, 400, 'One or more roles do not exist');
    return;
  }

  if (await UserModel.exists({ email: input.data.email })) {
    problem(req, res, 409, 'Email is already registered');
    return;
  }

  const user = await UserModel.create({
    email: input.data.email,
    fullName: input.data.fullName,
    phoneNumber: input.data.phoneNumber,
    isVerified: true,
    passwordHash: await bcrypt.hash(input.data.password, SALT_ROUNDS),
  });
  if (roles.length > 0) {
    await UserRoleModel.insertMany(roles.map((role) => ({ userId: user._id, roleId: role._id })));
  }
  let permissions = await RolePermissionModel.distinct('permission', {
    role_id: { $in: roles.map((role) => role._id) },
  });
  if (requestedRoles.includes('root')) {
    permissions = Object.values(Permission);
  }

  res.status(201).json({
    user: {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      phoneNumber: user.phoneNumber,
      isVerified: user.isVerified,
      roles: requestedRoles,
      permissions,
    },
  });
});

router.put('/:id', mustHavePermissions(Permission.UsersUpdate), async (req, res) => {
  if (!isValidObjectId(req.params.id)) {
    problem(req, res, 404, 'User not found');
    return;
  }

  const input = userUpdateInput.safeParse(req.body);
  if (!input.success) {
    problem(req, res, 400, input.error.issues[0]?.message ?? 'Invalid request');
    return;
  }

  const user = await UserModel.findById(req.params.id);
  if (!user) {
    problem(req, res, 404, 'User not found');
    return;
  }

  const rootRole = await RoleModel.findOne({ name: 'root' }).select('_id');
  let isRoot = false;
  if (rootRole) {
    isRoot = Boolean(await UserRoleModel.exists({ userId: req.user!.id, roleId: rootRole._id }));
  }
  const targetUserRoles = await UserRoleModel.find({ userId: user._id }).select('roleId');
  const targetRoleIds = targetUserRoles.map((userRole) => userRole.roleId);
  const targetRoleDocuments = await RoleModel.find({ _id: { $in: targetRoleIds } }).select('name');
  const targetRoles = targetRoleDocuments.map((role) => role.name);
  if (!isRoot && targetRoles.includes('root')) {
    problem(req, res, 403, 'Only root users can manage root users');
    return;
  }
  if (!isRoot && input.data.roles.includes('root')) {
    problem(req, res, 403, 'Only root users can grant the root role');
    return;
  }
  const requestedRoles = [...new Set(input.data.roles)];
  const roles = await RoleModel.find({ name: { $in: requestedRoles } }).select('_id name');
  if (roles.length !== requestedRoles.length) {
    problem(req, res, 400, 'One or more roles do not exist');
    return;
  }
  if (
    user.id === req.user!.id &&
    !input.data.roles.includes('root') &&
    targetRoles.includes('root')
  ) {
    problem(req, res, 400, 'You cannot remove your own root role');
    return;
  }

  const emailOwner = await UserModel.exists({ email: input.data.email, _id: { $ne: user._id } });
  if (emailOwner) {
    problem(req, res, 409, 'Email is already registered');
    return;
  }

  if (user.email !== input.data.email) {
    user.isVerified = false;
    if (targetRoles.includes('root') || targetRoles.includes('admin')) {
      user.isVerified = true;
    }
    user.verificationTokenHash = undefined;
    user.verificationExpiresAt = undefined;
    user.verificationSentAt = undefined;
    user.verificationEmail = undefined;
  }
  user.email = input.data.email;
  user.fullName = input.data.fullName;
  if (input.data.phoneNumber !== undefined) {
    user.phoneNumber = input.data.phoneNumber;
  }
  if (input.data.password) {
    user.passwordHash = await bcrypt.hash(input.data.password, SALT_ROUNDS);
  }
  await user.save();
  await UserRoleModel.deleteMany({ userId: user._id });
  if (roles.length > 0) {
    await UserRoleModel.insertMany(roles.map((role) => ({ userId: user._id, roleId: role._id })));
  }
  let permissions = await RolePermissionModel.distinct('permission', {
    role_id: { $in: roles.map((role) => role._id) },
  });
  if (requestedRoles.includes('root')) {
    permissions = Object.values(Permission);
  }

  res.json({
    user: {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      phoneNumber: user.phoneNumber,
      isVerified: user.isVerified,
      roles: requestedRoles,
      permissions,
    },
  });
});

router.delete('/:id', mustHavePermissions(Permission.UsersDelete), async (req, res) => {
  if (!isValidObjectId(req.params.id)) {
    problem(req, res, 404, 'User not found');
    return;
  }
  if (req.params.id === req.user!.id) {
    problem(req, res, 400, 'You cannot delete your own account');
    return;
  }

  const user = await UserModel.findById(req.params.id);
  if (!user) {
    problem(req, res, 404, 'User not found');
    return;
  }

  const rootRole = await RoleModel.findOne({ name: 'root' }).select('_id');
  let isRoot = false;
  if (rootRole) {
    isRoot = Boolean(await UserRoleModel.exists({ userId: req.user!.id, roleId: rootRole._id }));
  }
  const targetUserRoles = await UserRoleModel.find({ userId: user._id }).select('roleId');
  const targetRoleIds = targetUserRoles.map((userRole) => userRole.roleId);
  const targetRoleDocuments = await RoleModel.find({ _id: { $in: targetRoleIds } }).select('name');
  const targetRoles = targetRoleDocuments.map((role) => role.name);
  if (!isRoot && targetRoles.includes('root')) {
    problem(req, res, 403, 'Only root users can manage root users');
    return;
  }

  await UserRoleModel.deleteMany({ userId: user._id });
  await user.deleteOne();
  res.status(204).end();
});

export default router;
