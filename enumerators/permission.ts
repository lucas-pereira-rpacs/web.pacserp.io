export const Permission = {
  UsersRead: 'users.read',
  UsersCreate: 'users.create',
  UsersUpdate: 'users.update',
  UsersDelete: 'users.delete',
  RolesRead: 'roles.read',
  RolesCreate: 'roles.create',
  RolesUpdate: 'roles.update',
  RolesDelete: 'roles.delete',
  SystemRead: 'system.read',
  SystemUpdate: 'system.update',
} as const;

export type Permission = (typeof Permission)[keyof typeof Permission];
