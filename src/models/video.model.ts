// src/models/video.model.ts
// ============================================================
// DESIGN PATTERNS APPLIED:
//
//   SRP (Single Responsibility Principle):
//     Only responsible for Video schema definition and its
//     directly associated query/command operations.
//
//   Abstraction:
//     `incrementViews()` hides the save() call detail from the
//     caller — they call one method without knowing the mechanics.
//
//   Encapsulation:
//     Static query methods hide filter construction. Callers pass
//     simple strings (ownerId) not ObjectId or query objects.
//
//   Adapter Pattern:
//     mongooseAggregatePaginate plugs a third-party pagination
//     API into Mongoose without changing the schema.
//
//   Factory Method (Conceptual):
//     `mongoose.model(...)` acts as a factory that produces
//     typed model instances from the schema definition.
// ============================================================

import mongoose, { Schema, Model } from 'mongoose';
import mongooseAggregatePaginate from 'mongoose-aggregate-paginate-v2';
import { IVideo } from '../types/video.types.js';

// Extended model interface with static helper methods
interface IVideoModel extends Model<IVideo> {
  findPublished(): Promise<IVideo[]>;
  findByOwner(ownerId: string): Promise<IVideo[]>;
}

const videoSchema = new Schema<IVideo>(
  {
    videoFile: {
      type: String,
      required: true,
    },
    thumbnail: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    duration: {
      type: Number,
      required: true,
    },
    // Encapsulation: default value handled here, not in the controller
    views: {
      type: Number,
      default: 0,
    },
    isPublished: {
      type: Boolean,
      default: true,
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// -------------------------------------------------------
// Instance method: incrementViews
// Abstraction: hides counter + save() implementation detail
// -------------------------------------------------------
videoSchema.methods.incrementViews = async function (): Promise<void> {
  this.views += 1;
  await this.save();
};

// -------------------------------------------------------
// Static: Fetch all published videos
// -------------------------------------------------------
videoSchema.static('findPublished', async function (): Promise<IVideo[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return await this.find({ isPublished: true } as any);
});

// -------------------------------------------------------
// Static: Fetch videos by owner (Encapsulation: ObjectId cast hidden)
// -------------------------------------------------------
videoSchema.static(
  'findByOwner',
  async function (ownerId: string): Promise<IVideo[]> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return await this.find({ owner: new mongoose.Types.ObjectId(ownerId) } as any);
  }
);

// Adapter Pattern: plugs pagination into the schema
videoSchema.plugin(mongooseAggregatePaginate);

// Factory Method: mongoose.model produces the typed model
export const Video = mongoose.model<IVideo, IVideoModel>('Video', videoSchema);
