// src/types/video.types.ts
// ============================================================
// DESIGN PATTERNS APPLIED:
//   - Interface Segregation Principle (ISP): Separation of 
//     document structure containing methods (IVideo) from
//     pure DTO (VideoDTO) for external usage.
//   - Encapsulation: Strict typings across data.
// ============================================================

import { Document, Schema } from 'mongoose';

export interface IVideo extends Document {
  videoFile: string;
  thumbnail: string;
  title: string;
  description: string;
  duration: number;
  views: number;
  isPublished: boolean;
  owner: Schema.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;

  // Instance methods
  incrementViews(): Promise<void>;
}

export interface VideoDTO {
  videoFile: string;
  thumbnail: string;
  title: string;
  description: string;
  duration: number;
  owner: string;
}
