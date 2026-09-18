import { model, Schema, type HydratedDocument } from 'mongoose';

export type RoleDocument = HydratedDocument<Role>;

const roleSchema = new Schema<Role>({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
});

export const RoleModel = model<Role>('Role', roleSchema);
