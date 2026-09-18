import { model, Schema, type HydratedDocument } from 'mongoose';

export type UserRoleDocument = HydratedDocument<UserRole>;

const userRoleSchema = new Schema<UserRole>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  roleId: {
    type: Schema.Types.ObjectId,
    ref: 'Role',
    required: true,
  },
});

userRoleSchema.index({ userId: 1, roleId: 1 }, { unique: true });

export const UserRoleModel = model<UserRole>('UserRole', userRoleSchema);
