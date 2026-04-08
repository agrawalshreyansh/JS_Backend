// src/services/UserModelService.ts
// ============================================================
// DESIGN PATTERNS APPLIED:
//
//   SRP (Single Responsibility Principle):
//     This service ONLY handles user-related database operations.
//     It does NOT handle HTTP logic, caching, or emails.
//
//   Facade Pattern:
//     Provides a simplified interface over the Mongoose User
//     model so controllers don't call User.findOne() directly.
//
//   Encapsulation:
//     The underlying model calls are hidden. The service exposes
//     only high-level, intention-revealing methods.
//
//   DIP (Dependency Inversion Principle):
//     Controllers/callers depend on this service abstraction,
//     not on the concrete Mongoose User model.
//
//   Factory Method (Conceptual):
//     registerUser acts as a factory — it validates uniqueness,
//     then produces a new User document.
// ============================================================

import { User } from '../models/user.model.js';
import { IUser, UserDTO } from '../types/user.types.js';
import { ApiError } from '../utils/ApiError.js';

export class UserModelService {

  // -------------------------------------------------------
  // registerUser — Factory Method pattern
  // Creates a new User after checking for existing duplicates.
  // SRP: uniqueness check + creation stays here, not in controller.
  // -------------------------------------------------------
  async registerUser(userData: UserDTO): Promise<IUser> {
    // Encapsulation: check logic is hidden from the caller
    const existingUser = await User.findOne({
      $or: [{ username: userData.username }, { email: userData.email }],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);

    if (existingUser) {
      throw new ApiError(409, 'User with email or username already exists');
    }

    const user = await User.create(userData);
    return user;
  }

  // -------------------------------------------------------
  // findUserByUsername — Abstraction over DB query
  // -------------------------------------------------------
  async findUserByUsername(username: string): Promise<IUser | null> {
    return await User.findOne({ username: username.toLowerCase() } as any);
  }

  // -------------------------------------------------------
  // findUserByEmail — Abstraction over DB query
  // -------------------------------------------------------
  async findUserByEmail(email: string): Promise<IUser | null> {
    return await User.findOne({ email: email.toLowerCase() } as any);
  }

  // -------------------------------------------------------
  // findUserById — Abstraction, validates ObjectId internally
  // -------------------------------------------------------
  async findUserById(userId: string): Promise<IUser | null> {
    return await User.findById(userId);
  }

  // -------------------------------------------------------
  // updateRefreshToken — Encapsulation over token update
  // -------------------------------------------------------
  async updateRefreshToken(userId: string, token: string): Promise<void> {
    await User.findByIdAndUpdate(userId, { refreshToken: token });
  }

  // -------------------------------------------------------
  // clearRefreshToken — Strategy Pattern:
  // Swappable logout strategy (clear token vs blacklist etc.)
  // -------------------------------------------------------
  async clearRefreshToken(userId: string): Promise<void> {
    await User.findByIdAndUpdate(userId, { refreshToken: null });
  }
}
