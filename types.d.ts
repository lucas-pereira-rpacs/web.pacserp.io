interface ImportMetaEnv {
  readonly DEFAULT_LOCALE?: 'en' | 'pt';
  readonly DEFAULT_SYSTEM_NAME?: string;
  readonly DEFAULT_SYSTEM_SLOGAN?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

interface User {
  email: string;
  fullName: string;
  phoneNumber?: string;
  isVerified: boolean;
  verificationTokenHash?: string;
  verificationExpiresAt?: Date;
  verificationSentAt?: Date;
  verificationEmail?: string;
  passwordHash: string;
  createdAt: Date;
  updatedAt: Date;
}

interface Role {
  name: string;
}

interface RolePermission {
  role_id: import('mongoose').Types.ObjectId;
  permission: import('#enumerators/permission').Permission;
}

interface System {
  name: string;
  slogan: string;
  features: import('#enumerators/feature').Feature[];
}

interface PublicSystemResponse {
  system: System;
}

interface UserRole {
  userId: import('mongoose').Types.ObjectId;
  roleId: import('mongoose').Types.ObjectId;
}

interface PublicUser {
  id: string;
  email: string;
  fullName: string;
  phoneNumber?: string;
  isVerified: boolean;
}

interface UserProfile extends PublicUser {
  roles: string[];
  permissions: import('#enumerators/permission').Permission[];
}

interface ProfileResponse {
  user: UserProfile;
}

interface UsersResponse {
  users: UserProfile[];
}

interface PublicRole {
  id: string;
  name: string;
  usersCount: number;
}

interface RolesResponse {
  roles: PublicRole[];
}

interface PublicUserRole {
  id: string;
  userId: string;
  roleId: string;
}

interface UserRolesResponse {
  userRoles: PublicUserRole[];
}

interface PublicRolePermission {
  id: string;
  role_id: string;
  permission: import('#enumerators/permission').Permission;
}

interface RolePermissionsResponse {
  rolePermissions: PublicRolePermission[];
}

declare namespace Express {
  interface User extends PublicUser {}
}
