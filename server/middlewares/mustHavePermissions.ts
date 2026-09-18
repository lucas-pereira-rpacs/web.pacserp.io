import type { RequestHandler } from 'express';
import type { Permission } from '#enumerators/permission';
import { RoleModel } from '#models/role';
import { RolePermissionModel } from '#models/rolePermission';
import { UserRoleModel } from '#models/userRole';
import problem from '#problem';

export default function mustHavePermissions(...permissions: Permission[]): RequestHandler {
  return async (req, res, next) => {
    if (!req.isAuthenticated()) {
      problem(req, res, 401, 'Not authenticated');
      return;
    }

    const userRoles = await UserRoleModel.find({ userId: req.user.id }).select('roleId');
    const roleIds = userRoles.map((userRole) => userRole.roleId);
    const isRoot = await RoleModel.exists({ _id: { $in: roleIds }, name: 'root' });
    if (isRoot) {
      next();
      return;
    }

    const requiredPermissions = [...new Set(permissions)];
    const assignedPermissions = await RolePermissionModel.distinct('permission', {
      role_id: { $in: roleIds },
      permission: { $in: requiredPermissions },
    });

    if (assignedPermissions.length !== requiredPermissions.length) {
      problem(req, res, 403, 'Required permissions are missing');
      return;
    }

    next();
  };
}
