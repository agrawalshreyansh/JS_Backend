// src/base/BaseService.ts
// ============================================================
// DESIGN PATTERNS APPLIED:
//   - DIP (Dependency Inversion Principle): Depends on the
//     Mongoose `Model<T>` abstraction, not a concrete model.
//   - Abstraction: Shows WHAT operations are possible (CRUD),
//     not HOW Mongoose executes them.
//   - Template Method: Concrete services extend and override
//     individual methods without rewriting CRUD boilerplate.
//   - OCP (Open/Closed): Base stays closed for modification;
//     subclasses extend it with new behaviour.
//   - Generic / Composition over Inheritance: Uses TypeScript
//     generics so one base class handles ANY Document type.
// ============================================================

import { Document, Model, FilterQuery, UpdateQuery } from 'mongoose';

/**
 * BaseService<T> — Generic CRUD service base.
 *
 * DIP: The constructor accepts a `Model<T>` (abstraction),
 * so concrete services inject their own model — we never
 * depend on a specific concrete class.
 *
 * T must extend Document so that Mongoose typing is preserved.
 */
export abstract class BaseService<T extends Document> {
  // ENCAPSULATION: model is private to this class hierarchy.
  // Subclasses interact with it only through the public/
  // protected methods defined here.
  constructor(protected readonly model: Model<T>) {}

  // -------------------------------------------------------
  // Create — wraps model.create, typed against T
  // -------------------------------------------------------
  async create(data: Partial<T>): Promise<T> {
    // Composition: delegates to Mongoose model (not inheriting from it)
    return await this.model.create(data);
  }

  // -------------------------------------------------------
  // Read — findById
  // -------------------------------------------------------
  async findById(id: string): Promise<T | null> {
    return await this.model.findById(id);
  }

  // -------------------------------------------------------
  // Read — findOne with typed filter
  // -------------------------------------------------------
  async findOne(filter: FilterQuery<T>): Promise<T | null> {
    return await this.model.findOne(filter);
  }

  // -------------------------------------------------------
  // Read — find many with typed filter
  // -------------------------------------------------------
  async find(filter: FilterQuery<T> = {}): Promise<T[]> {
    return await this.model.find(filter);
  }

  // -------------------------------------------------------
  // Update — findByIdAndUpdate
  // -------------------------------------------------------
  async updateById(id: string, data: UpdateQuery<T>): Promise<T | null> {
    return await this.model.findByIdAndUpdate(id, data, { new: true });
  }

  // -------------------------------------------------------
  // Delete — findByIdAndDelete
  // -------------------------------------------------------
  async deleteById(id: string): Promise<T | null> {
    return await this.model.findByIdAndDelete(id);
  }

  // -------------------------------------------------------
  // Update — findOneAndUpdate with typed filter and update
  // -------------------------------------------------------
  async findAndUpdate(
    filter: FilterQuery<T>,
    data: UpdateQuery<T>
  ): Promise<T | null> {
    return await this.model.findOneAndUpdate(filter, data, { new: true });
  }
}
