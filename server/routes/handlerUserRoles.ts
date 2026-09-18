import { Router } from 'express';
import { isValidObjectId } from 'mongoose';
import { z } from 'zod';
import { Permission } from '#enumerators/permission';
import mustHavePermissions from '#middlewares/mustHavePermissions';
import { RoleModel } from '#models/role';
import { UserModel } from '#models/user';
import { UserRoleModel } from '#models/userRole';
import problem from '#problem';

const router = Router();
const assignmentInput = z.object({ userId: z.string(), roleId: z.string() });

router.get('/', mustHavePermissions(Permission.UsersRead), async (_req, res) => {
  const assignments = await UserRoleModel.find().sort({ userId: 1, roleId: 1 });
  res.json({
    userRoles: assignments.map((assignment) => ({
      id: assignment.id,
      userId: assignment.userId.toString(),
      roleId: assignment.roleId.toString(),
    })),
  });
});

router.post('/', mustHavePermissions(Permission.UsersUpdate), async (req, res) => {
  const input = assignmentInput.safeParse(req.body);
  if (
    !input.success ||
    !isValidObjectId(input.data.userId) ||
    !isValidObjectId(input.data.roleId)
  ) {
    problem(req, res, 400, 'Valid userId and roleId are required');
    return;
  }
  const [user, role] = await Promise.all([
    UserModel.findById(input.data.userId),
    RoleModel.findById(input.data.roleId),
  ]);
  if (!user || !role) {
    problem(req, res, 404, 'User or role not found');
    return;
  }
  if (await UserRoleModel.exists(input.data)) {
    problem(req, res, 409, 'User already has this role');
    return;
  }

  const assignment = await UserRoleModel.create(input.data);
  res.status(201).json({ userRole: { id: assignment.id, userId: user.id, roleId: role.id } });
});

router.put('/:id', mustHavePermissions(Permission.UsersUpdate), async (req, res) => {
  if (!isValidObjectId(req.params.id)) {
    problem(req, res, 404, 'User role not found');
    return;
  }
  const input = assignmentInput.safeParse(req.body);
  if (
    !input.success ||
    !isValidObjectId(input.data.userId) ||
    !isValidObjectId(input.data.roleId)
  ) {
    problem(req, res, 400, 'Valid userId and roleId are required');
    return;
  }
  const assignment = await UserRoleModel.findById(req.params.id);
  if (!assignment) {
    problem(req, res, 404, 'User role not found');
    return;
  }
  const currentRole = await RoleModel.findById(assignment.roleId).select('name');
  const changesOwnRoot =
    assignment.userId.toString() === req.user!.id &&
    currentRole?.name === 'root' &&
    (input.data.userId !== req.user!.id || input.data.roleId !== assignment.roleId.toString());
  if (changesOwnRoot) {
    problem(req, res, 400, 'You cannot remove your own root role');
    return;
  }
  const [user, role] = await Promise.all([
    UserModel.findById(input.data.userId),
    RoleModel.findById(input.data.roleId),
  ]);
  if (!user || !role) {
    problem(req, res, 404, 'User or role not found');
    return;
  }
  if (await UserRoleModel.exists({ ...input.data, _id: { $ne: assignment._id } })) {
    problem(req, res, 409, 'User already has this role');
    return;
  }

  assignment.userId = user._id;
  assignment.roleId = role._id;
  await assignment.save();
  res.json({ userRole: { id: assignment.id, userId: user.id, roleId: role.id } });
});

router.delete('/:id', mustHavePermissions(Permission.UsersUpdate), async (req, res) => {
  if (!isValidObjectId(req.params.id)) {
    problem(req, res, 404, 'User role not found');
    return;
  }
  const assignment = await UserRoleModel.findById(req.params.id);
  if (!assignment) {
    problem(req, res, 404, 'User role not found');
    return;
  }
  const role = await RoleModel.findById(assignment.roleId).select('name');
  if (assignment.userId.toString() === req.user!.id && role?.name === 'root') {
    problem(req, res, 400, 'You cannot remove your own root role');
    return;
  }

  await assignment.deleteOne();
  res.status(204).end();
});

export default router;
