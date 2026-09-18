import { Router } from 'express';
import { isValidObjectId } from 'mongoose';
import { z } from 'zod';
import { Permission } from '#enumerators/permission';
import mustHavePermissions from '#middlewares/mustHavePermissions';
import { RoleModel } from '#models/role';
import { RolePermissionModel } from '#models/rolePermission';
import problem from '#problem';

const router = Router();
const rolePermissionInput = z.object({
  role_id: z.string(),
  permission: z.enum(Permission),
});

router.get('/', mustHavePermissions(Permission.RolesRead), async (_req, res) => {
  const rolePermissions = await RolePermissionModel.find().sort({ role_id: 1, permission: 1 });
  res.json({
    rolePermissions: rolePermissions.map((rolePermission) => ({
      id: rolePermission.id,
      role_id: rolePermission.role_id.toString(),
      permission: rolePermission.permission,
    })),
  });
});

router.get('/:id', mustHavePermissions(Permission.RolesRead), async (req, res) => {
  if (!isValidObjectId(req.params.id)) {
    problem(req, res, 404, 'Role permission not found');
    return;
  }

  const rolePermission = await RolePermissionModel.findById(req.params.id);
  if (!rolePermission) {
    problem(req, res, 404, 'Role permission not found');
    return;
  }

  res.json({
    rolePermission: {
      id: rolePermission.id,
      role_id: rolePermission.role_id.toString(),
      permission: rolePermission.permission,
    },
  });
});

router.post('/', mustHavePermissions(Permission.RolesUpdate), async (req, res) => {
  const input = rolePermissionInput.safeParse(req.body);
  if (!input.success || !isValidObjectId(input.data.role_id)) {
    problem(req, res, 400, 'Valid role_id and permission are required');
    return;
  }

  const role = await RoleModel.findById(input.data.role_id);
  if (!role) {
    problem(req, res, 404, 'Role not found');
    return;
  }

  if (
    await RolePermissionModel.exists({
      role_id: input.data.role_id,
      permission: input.data.permission,
    })
  ) {
    problem(req, res, 409, 'Permission is already assigned');
    return;
  }

  const rolePermission = await RolePermissionModel.create({
    role_id: role._id,
    permission: input.data.permission,
  });
  res.status(201).json({
    rolePermission: {
      id: rolePermission.id,
      role_id: role.id,
      permission: rolePermission.permission,
    },
  });
});

router.put('/:id', mustHavePermissions(Permission.RolesUpdate), async (req, res) => {
  if (!isValidObjectId(req.params.id)) {
    problem(req, res, 404, 'Role permission not found');
    return;
  }

  const input = rolePermissionInput.safeParse(req.body);
  if (!input.success || !isValidObjectId(input.data.role_id)) {
    problem(req, res, 400, 'Valid role_id and permission are required');
    return;
  }

  const rolePermission = await RolePermissionModel.findById(req.params.id);
  if (!rolePermission) {
    problem(req, res, 404, 'Role permission not found');
    return;
  }

  const role = await RoleModel.findById(input.data.role_id);
  if (!role) {
    problem(req, res, 404, 'Role not found');
    return;
  }

  const permissionExists = await RolePermissionModel.exists({
    role_id: input.data.role_id,
    permission: input.data.permission,
    _id: { $ne: rolePermission._id },
  });
  if (permissionExists) {
    problem(req, res, 409, 'Permission is already assigned');
    return;
  }

  rolePermission.role_id = role._id;
  rolePermission.permission = input.data.permission;
  await rolePermission.save();
  res.json({
    rolePermission: {
      id: rolePermission.id,
      role_id: role.id,
      permission: rolePermission.permission,
    },
  });
});

router.delete('/:id', mustHavePermissions(Permission.RolesUpdate), async (req, res) => {
  if (!isValidObjectId(req.params.id)) {
    problem(req, res, 404, 'Role permission not found');
    return;
  }

  const rolePermission = await RolePermissionModel.findById(req.params.id);
  if (!rolePermission) {
    problem(req, res, 404, 'Role permission not found');
    return;
  }

  await rolePermission.deleteOne();
  res.status(204).end();
});

export default router;
