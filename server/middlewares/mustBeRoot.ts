import type { RequestHandler } from 'express';
import { RoleModel } from '#models/role';
import { UserRoleModel } from '#models/userRole';
import problem from '#problem';

const mustBeRoot: RequestHandler = async (req, res, next) => {
  if (!req.isAuthenticated()) {
    problem(req, res, 401, 'Not authenticated');
    return;
  }

  const role = await RoleModel.findOne({ name: 'root' }).select('_id');
  if (!role) {
    problem(req, res, 403, 'Root access is required');
    return;
  }

  const userRole = await UserRoleModel.exists({
    userId: req.user.id,
    roleId: role._id,
  });

  if (!userRole) {
    problem(req, res, 403, 'Root access is required');
    return;
  }

  next();
};

export default mustBeRoot;
