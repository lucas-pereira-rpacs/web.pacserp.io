import { model, Schema, type HydratedDocument } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

const userSchema = new Schema<User>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      maxlength: 254,
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    phoneNumber: {
      type: String,
      trim: true,
      maxlength: 50,
    },
    isVerified: {
      type: Boolean,
      required: true,
      default: false,
    },
    passwordHash: {
      type: String,
      required: true,
      select: false,
    },
    verificationTokenHash: { type: String, select: false },
    verificationExpiresAt: { type: Date, select: false },
    verificationSentAt: { type: Date, select: false },
    verificationEmail: { type: String, select: false },
  },
  { timestamps: true },
);

export const UserModel = model<User>('User', userSchema);
