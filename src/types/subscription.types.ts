// src/types/subscription.types.ts
// ============================================================
// DESIGN PATTERNS APPLIED:
//   - Interface Segregation Principle (ISP)
// ============================================================

import { Document, Schema } from 'mongoose';

export interface ISubscription extends Document {
  subscriber: Schema.Types.ObjectId;
  channel: Schema.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface SubscriptionDTO {
  subscriber: string;
  channel: string;
}
