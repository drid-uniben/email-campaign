import mongoose, { Document, Schema, Types } from 'mongoose';
import bcrypt from 'bcryptjs';

// Simplified User roles
export enum UserRole {
  ADMIN = 'admin',
  USER = 'user', // General user/intern
}

export interface IUser extends Document {
  name: string;
  email: string;
  password?: string; // Only for Admin
  role: UserRole;
  unit?: Types.ObjectId; // Reference to Unit model
  isApproved: boolean;
  rejectionReason?: string;
  isActive: boolean;
  refreshToken?: string; // For persistent admin login sessions
  lastLogin?: Date;
  createdAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const UserSchema: Schema<IUser> = new Schema(
  {
    name: {
      type: String,
      trim: true,
      required: [true, 'Name is required'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        'Please provide a valid email address',
      ],
    },
    password: {
      type: String,
      select: false, // Hide by default
    },
    role: {
      type: String,
      enum: Object.values(UserRole),
      default: UserRole.USER,
    },
    unit: {
      type: Schema.Types.ObjectId,
      ref: 'Unit',
    },
    isApproved: {
      type: Boolean,
      default: false,
    },
    rejectionReason: {
      type: String,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    refreshToken: {
      type: String,
      select: false,
    },
    lastLogin: {
      type: Date,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Password hashing for Admin
UserSchema.pre<IUser>('save', async function (next) {
  if (this.password && this.isModified('password')) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }
  next();
});

UserSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  if (!this.password) return false;
  return await bcrypt.compare(candidatePassword, this.password);
};

// Indexes
UserSchema.index({ role: 1 });
UserSchema.index({ unit: 1 });

export default mongoose.model<IUser>('User', UserSchema);
