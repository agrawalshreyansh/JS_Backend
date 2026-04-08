// src/models/BaseModel.ts
// ============================================================
// DESIGN PATTERNS APPLIED:
//   - Abstraction: Abstracting generic database calls into one
//     class. Keeps database logic decoupled from exact schema.
//   - Open/Closed Principle (OCP): We can extend BaseModel
//     to add model-specific logic without modifying existing 
//     CRUD functionality.
//   - Dependency Inversion (DIP): Services can depend on 
//     BaseModel's interface rather than concrete mongoose models.
//   - Template Method (Concept): Acts as a skeleton for subclasses.
// ============================================================

import { Document, Model, Schema } from 'mongoose';
import mongoose from 'mongoose';

export abstract class BaseModel<T extends Document> {
  protected model: Model<T>;

  constructor(model: Model<T>) {
    this.model = model;
  }

  // Creational generic method
  async create(data: Partial<T>): Promise<T> {
    return await this.model.create(data);
  }

  // Abstracted read method
  async findById(id: string): Promise<T | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return null;
    }
    return await this.model.findById(id);
  }

  async findOne(filter: any): Promise<T | null> {
    return await this.model.findOne(filter);
  }

  async find(filter?: any): Promise<T[]> {
    return await this.model.find(filter || {});
  }

  async updateById(id: string, data: Partial<T>): Promise<T | null> {
    return await this.model.findByIdAndUpdate(id, data, { new: true });
  }

  async deleteById(id: string): Promise<T | null> {
    return await this.model.findByIdAndDelete(id);
  }

  async countDocuments(filter?: any): Promise<number> {
    return await this.model.countDocuments(filter || {});
  }

  async exists(filter: any): Promise<boolean> {
    const doc = await this.model.findOne(filter);
    return !!doc;
  }
}
