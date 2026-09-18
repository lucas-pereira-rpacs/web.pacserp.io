import { model, Schema, type HydratedDocument } from 'mongoose';
import { Permission } from '#enumerators/permission';

export type RolePermissionDocument = HydratedDocument<RolePermission>;

const rolePermissionSchema = new Schema<RolePermission>(
  {
    role_id: {
      type: Schema.Types.ObjectId,
      ref: 'Role',
      required: true,
    },
    permission: {
      type: String,
      enum: Object.values(Permission),
      required: true,
    },
  },
  { collection: 'roles_permissions' },
);

rolePermissionSchema.index({ role_id: 1, permission: 1 }, { unique: true });

export const RolePermissionModel = model<RolePermission>('RolePermission', rolePermissionSchema);
