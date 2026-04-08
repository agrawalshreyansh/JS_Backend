// src/models/subscription.model.ts
// ============================================================
// DESIGN PATTERNS APPLIED:
//
//   SRP (Single Responsibility Principle):
//     This file only defines the Subscription schema and its
//     direct query operations. Business logic lives elsewhere.
//
//   Composite Pattern (Conceptual):
//     A subscription links two User nodes — one acting as
//     "subscriber", one as "channel". Both are ObjectId refs
//     to the same collection, composing a relationship graph.
//
//   Encapsulation:
//     Query helpers (findChannelSubscribers, getSubscriberCount)
//     hide the MongoDB filter detail from callers.
//
//   Abstraction:
//     Static methods expose WHAT they do (get subscriber count)
//     without leaking HOW (countDocuments with ObjectId cast).
// ============================================================

import mongoose, { Schema, Model } from 'mongoose';
import { ISubscription } from '../types/subscription.types.js';

// Extended model interface with static helper methods
// (Factory Method concept: each static is a named factory query)
interface ISubscriptionModel extends Model<ISubscription> {
  findBySubscriberAndChannel(
    subscriberId: string,
    channelId: string
  ): Promise<ISubscription | null>;
  findChannelSubscribers(channelId: string): Promise<ISubscription[]>;
  findSubscriberChannels(subscriberId: string): Promise<ISubscription[]>;
  getSubscriberCount(channelId: string): Promise<number>;
}

const subscriptionSchema = new Schema<ISubscription>(
  {
    // The user who subscribed
    subscriber: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // The channel (another User) being subscribed to
    channel: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to prevent duplicate subscriptions
// (Encapsulation: DB constraint enforced at schema level)
subscriptionSchema.index({ subscriber: 1, channel: 1 }, { unique: true });

// -------------------------------------------------------
// Static: Find exact subscriber-channel pair
// Abstraction: caller only needs IDs, not query shape
// -------------------------------------------------------
subscriptionSchema.static(
  'findBySubscriberAndChannel',
  async function (
    subscriberId: string,
    channelId: string
  ): Promise<ISubscription | null> {
    // Cast to ObjectId for strict-mode Mongoose v8 compatibility
    return await this.findOne({
      subscriber: new mongoose.Types.ObjectId(subscriberId),
      channel: new mongoose.Types.ObjectId(channelId),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);
  }
);

// -------------------------------------------------------
// Static: All subscribers for a given channel
// -------------------------------------------------------
subscriptionSchema.static(
  'findChannelSubscribers',
  async function (channelId: string): Promise<ISubscription[]> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return await this.find({ channel: new mongoose.Types.ObjectId(channelId) } as any)
      .populate('subscriber');
  }
);

// -------------------------------------------------------
// Static: All channels a subscriber follows
// -------------------------------------------------------
subscriptionSchema.static(
  'findSubscriberChannels',
  async function (subscriberId: string): Promise<ISubscription[]> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return await this.find({ subscriber: new mongoose.Types.ObjectId(subscriberId) } as any)
      .populate('channel');
  }
);

// -------------------------------------------------------
// Static: Count subscribers for a channel
// Strategy: uses countDocuments (no hydration, fast)
// -------------------------------------------------------
subscriptionSchema.static(
  'getSubscriberCount',
  async function (channelId: string): Promise<number> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return await this.countDocuments({ channel: new mongoose.Types.ObjectId(channelId) } as any);
  }
);

// Factory Method: mongoose.model creates the typed proxy
export const Subscription = mongoose.model<ISubscription, ISubscriptionModel>(
  'Subscription',
  subscriptionSchema
);
