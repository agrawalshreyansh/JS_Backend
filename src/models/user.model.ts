// src/models/user.model.ts
// ============================================================
// DESIGN PATTERNS APPLIED:
//   - Single Responsibility Principle (SRP): This model defines 
//     the schema and direct interactions with user data only.
//   - Observer Pattern: Mongoose's `pre('save')` hook acts as 
//     an observer that reacts before saving (for password hashing).
//   - Strategy (Concept): Generating tokens and hashing passwords 
//     are localized algorithms within the document.
//   - Encapsulation: Hashing logic hides the complexity of bcrypt
//     from the consumer. Token logic is localized to the model methods.
// ============================================================

import mongoose, { Schema, Document, Model } from 'mongoose';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import mongooseAggregatePaginate from 'mongoose-aggregate-paginate-v2';
import { IUser } from '../types/user.types.js';

interface IUserModel extends Model<IUser> {
  findByUsername(username: string): Promise<IUser | null>;
  findByEmail(email: string): Promise<IUser | null>;
}

const userSchema = new Schema<IUser>(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      unique: true,
      trim: true,
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    avatar: {
      type: String,
      required: true,
    },
    coverImage: {
      type: String,
    },
    watchHistory: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Video',
      },
    ],
    password: {
      type: String,
      required: [true, 'Password is required'],
    },
    refreshToken: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save hook (Observer Pattern for hashing strategy)
userSchema.pre<IUser>('save', async function (next: any) {
  if (!this.isModified('password')) return next();

  try {
    const hashedPassword = await bcrypt.hash(this.password, 10);
    this.password = hashedPassword;
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Instance method: Encapsulating password comparison
userSchema.methods.isPasswordCorrect = async function (
  password: string
): Promise<boolean> {
  return await bcrypt.compare(password, this.password);
};

// Instance method: Encapsulating JWT Access token logic
userSchema.methods.generateAccessToken = function (): string {
  return jwt.sign(
    {
      _id: this._id,
      email: this.email,
      username: this.username,
      fullName: this.fullName,
    },
    process.env.ACCESS_TOKEN_SECRET || 'secret',
    { expiresIn: (process.env.ACCESS_TOKEN_EXPIRY || '1d') as any }
  );
};

// Instance method: Encapsulating JWT Refresh token logic
userSchema.methods.generateRefreshToken = function (): string {
  return jwt.sign(
    {
      _id: this._id,
    },
    process.env.REFRESH_TOKEN_SECRET || 'secret',
    { expiresIn: (process.env.REFRESH_TOKEN_EXPIRY || '10d') as any }
  );
};

// Static method
userSchema.static('findByUsername', async function (
  username: string
): Promise<IUser | null> {
  return await this.findOne({ username: username.toLowerCase() });
});

// Static method
userSchema.static('findByEmail', async function (
  email: string
): Promise<IUser | null> {
  return await this.findOne({ email: email.toLowerCase() });
});

// Plugin for pagination with aggregation
// Structural (Adapter) Pattern: adapting aggregation-paginate to schema
userSchema.plugin(mongooseAggregatePaginate);

// Factory Method (Concept): mongoose.model creates the document proxy
export const User = mongoose.model<IUser, IUserModel>('User', userSchema);
