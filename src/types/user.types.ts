// src/types/user.types.ts
// ============================================================
// DESIGN PATTERNS APPLIED:
//   - Interface Segregation Principle (ISP): We define granular
//     interfaces (UserDTO, LoginDTO) instead of forcing
//     everything to use the heavy IUser document type.
//   - Encapsulation: Explicit typing of what is allowed inside
//     interfaces.
// ============================================================

import { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  username: string;
  email: string;
  fullName: string;
  avatar: string;
  coverImage?: string;
  password: string;
  refreshToken?: string;
  watchHistory: Schema.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;

  // Instance methods
  generateAccessToken(): string;
  generateRefreshToken(): string;
  isPasswordCorrect(password: string): Promise<boolean>;
}

// Simplified DTO for transferring data
export interface UserDTO {
  username: string;
  email: string;
  fullName: string;
  password: string;
  avatar: string;
  coverImage?: string;
}

// Clean Login Interface
export interface LoginDTO {
  username?: string;
  email?: string;
  password: string;
}
