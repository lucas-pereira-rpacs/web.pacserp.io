import { Router } from 'express';
import { isValidObjectId } from 'mongoose';
import { z } from 'zod';
import { Permission } from '#enumerators/permission';
import mustHavePermissions from '#middlewares/mustHavePermissions';
import { RoleModel } from '#models/role';
import { RolePermissionModel } from '#models/rolePermission';
import { UserRoleModel } from '#models/userRole';
import problem from '#problem';

const router = Router();
const roleInput = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Name is required')
    .max(50)
    .regex(/^[a-z0-9_-]+$/, 'Use lowercase letters, numbers, hyphens, or underscores'),
});

router.get('/', mustHavePermissions(Permission.RolesRead), async (_req, res) => {
  const roles = await RoleModel.find().sort({ name: 1 });
  const assignments = await UserRoleModel.aggregate<{ _id: unknown; count: number }>([
    { $group: { _id: '$roleId', count: { $sum: 1 } } },
  ]);
  const counts = new Map(
    assignments.map((assignment) => [String(assignment._id), assignment.count]),
  );

  res.json({
    roles: roles.map((role) => ({
      id: role.id,
      name: role.name,
      usersCount: counts.get(role.id) ?? 0,
    })),
  });
});

router.post('/', mustHavePermissions(Permission.RolesCreate), async (req, res) => {
  const input = roleInput.safeParse(req.body);
  if (!input.success) {
    problem(req, res, 400, input.error.issues[0]?.message ?? 'Invalid request');
    return;
  }
  if (await RoleModel.exists({ name: input.data.name })) {
    problem(req, res, 409, 'Role already exists');
    return;
  }

  const role = await RoleModel.create(input.data);
  res.status(201).json({ role: { id: role.id, name: role.name, usersCount: 0 } });
});

router.put('/:id', mustHavePermissions(Permission.RolesUpdate), async (req, res) => {
  if (!isValidObjectId(req.params.id)) {
    problem(req, res, 404, 'Role not found');
    return;
  }
  const input = roleInput.safeParse(req.body);
  if (!input.success) {
    problem(req, res, 400, input.error.issues[0]?.message ?? 'Invalid request');
    return;
  }
  const role = await RoleModel.findById(req.params.id);
  if (!role) {
    problem(req, res, 404, 'Role not found');
    return;
  }
  if (role.name === 'root' || role.name === 'admin') {
    problem(req, res, 400, 'System roles cannot be renamed');
    return;
  }
  if (await RoleModel.exists({ name: input.data.name, _id: { $ne: role._id } })) {
    problem(req, res, 409, 'Role already exists');
    return;
  }

  role.name = input.data.name;
  await role.save();
  const usersCount = await UserRoleModel.countDocuments({ roleId: role._id });
  res.json({ role: { id: role.id, name: role.name, usersCount } });
});

router.delete('/:id', mustHavePermissions(Permission.RolesDelete), async (req, res) => {
  if (!isValidObjectId(req.params.id)) {
    problem(req, res, 404, 'Role not found');
    return;
  }
  const role = await RoleModel.findById(req.params.id);
  if (!role) {
    problem(req, res, 404, 'Role not found');
    return;
  }
  if (role.name === 'root' || role.name === 'admin') {
    problem(req, res, 400, 'System roles cannot be deleted');
    return;
  }

  await UserRoleModel.deleteMany({ roleId: role._id });
  await RolePermissionModel.deleteMany({ role_id: role._id });
  await role.deleteOne();
  res.status(204).end();
});

export default router;
