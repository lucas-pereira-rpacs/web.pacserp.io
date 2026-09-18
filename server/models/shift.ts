import { model, Schema, type HydratedDocument } from 'mongoose';

export type ShiftDocument = HydratedDocument<Shift>;

const shiftSchema = new Schema<Shift>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    startAt: {
      type: Date,
      required: true,
    },
    endAt: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ['scheduled', 'completed', 'cancelled'],
      default: 'scheduled',
    },
  },
  { timestamps: true },
);

shiftSchema.index({ userId: 1, startAt: 1 });
shiftSchema.index({ startAt: 1, endAt: 1 });

export const ShiftModel = model<Shift>('Shift', shiftSchema);
