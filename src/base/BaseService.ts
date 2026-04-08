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
//   - Composition Over Inheritance: Uses generics so one base
//     class handles ANY Document type without re-implementing
//     anything.
// ============================================================

import { Document, Model } from 'mongoose';

// A flexible filter/update shape that avoids Mongoose v8
// strict overload issues while keeping meaningful typing.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyFilter = Record<string, any>;

/**
 * BaseService<T> — Generic CRUD service base.
 *
 * DIP: The constructor accepts a Model<T> (abstraction),
 * so concrete services inject their own model — we never
 * depend on a specific concrete class.
 *
 * T must extend Document so Mongoose typing is preserved.
 */
export abstract class BaseService<T extends Document> {
  // ENCAPSULATION: model is private to this class hierarchy.
  // Subclasses interact with it only via the methods below.
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
  // Read — findOne with flexible filter
  // Abstraction: callers don't know how we query Mongoose
  // -------------------------------------------------------
  async findOne(filter: AnyFilter): Promise<T | null> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return await this.model.findOne(filter as any);
  }

  // -------------------------------------------------------
  // Read — find many with flexible filter
  // -------------------------------------------------------
  async find(filter: AnyFilter = {}): Promise<T[]> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return await this.model.find(filter as any);
  }

  // -------------------------------------------------------
  // Update — findByIdAndUpdate
  // -------------------------------------------------------
  async updateById(id: string, data: AnyFilter): Promise<T | null> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return await this.model.findByIdAndUpdate(id, data as any, { new: true });
  }

  // -------------------------------------------------------
  // Delete — findByIdAndDelete
  // -------------------------------------------------------
  async deleteById(id: string): Promise<T | null> {
    return await this.model.findByIdAndDelete(id);
  }

  // -------------------------------------------------------
  // Update — findOneAndUpdate with flexible filter + data
  // -------------------------------------------------------
  async findAndUpdate(filter: AnyFilter, data: AnyFilter): Promise<T | null> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return await this.model.findOneAndUpdate(filter as any, data as any, { new: true });
  }
}
