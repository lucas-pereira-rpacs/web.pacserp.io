import { model, Schema, type HydratedDocument } from 'mongoose';

export type SystemDocument = HydratedDocument<System>;

const systemSchema = new Schema<System>({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  slogan: {
    type: String,
    default: '',
    trim: true,
  },
  features: {
    type: [String],
    default: [],
  },
});

export const SystemModel = model<System>('System', systemSchema);
