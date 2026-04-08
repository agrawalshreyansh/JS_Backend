# Person 4: Controllers - Detailed Guide

## Overview
Convert all controller functions to class-based architecture with proper dependency injection and TypeScript typing.

---

## Phase 1: Create Controller Types

### Create types/controller.types.ts

```typescript
// src/types/controller.types.ts
export interface ControllerResponse {
  statusCode: number;
  data: any;
  message: string;
  success: boolean;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortType?: 'asc' | 'desc';
}

export interface RegisterUserRequest {
  fullName: string;
  email: string;
  username: string;
  password: string;
}

export interface LoginUserRequest {
  username?: string;
  email?: string;
  password: string;
}

export interface CreateVideoRequest {
  title: string;
  description: string;
  videoFile: string;
  thumbnail: string;
  duration: number;
}

export interface ToggleSubscriptionRequest {
  channelId: string;
}
```

---

## Phase 2: User Controller

### Create controllers/user.controller.ts

```typescript
// src/controllers/user.controller.ts
import { Request, Response, NextFunction } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/ApiError';
import { ApiResponse } from '../utils/ApiResponse';
import { User } from '../models/user.model';
import { CloudinaryService } from '../services/CloudinaryService';
import { BaseController } from '../base/BaseController';
import { AuthenticatedRequest, FileUploadRequest } from '../types/middleware.types';
import {
  RegisterUserRequest,
  LoginUserRequest,
} from '../types/controller.types';

export class UserController extends BaseController {
  private cloudinaryService = CloudinaryService;

  /**
   * Register a new user
   * POST /api/v1/users/register
   */
  registerUser = asyncHandler(
    async (req: FileUploadRequest, res: Response, next: NextFunction): Promise<void> => {
      try {
        const { fullName, email, username, password } = req.body as RegisterUserRequest;

        // Validation
        if ([fullName, email, username, password].some((field) => !field?.trim())) {
          throw new ApiError(400, 'All fields are required!');
        }

        // Check if user exists
        const existedUser = await User.findOne({
          $or: [{ username }, { email }],
        });

        if (existedUser) {
          throw new ApiError(
            409,
            'User with email or username already exists'
          );
        }

        // Handle avatar upload
        let avatarLocalPath: string | undefined;
        if (
          req.files &&
          Array.isArray((req.files as any).avatar) &&
          (req.files as any).avatar.length > 0
        ) {
          avatarLocalPath = (req.files as any).avatar[0].path;
        }

        if (!avatarLocalPath) {
          throw new ApiError(400, 'Avatar file is required');
        }

        // Handle cover image upload
        let coverImageLocalPath: string | undefined;
        if (
          req.files &&
          Array.isArray((req.files as any).coverImage) &&
          (req.files as any).coverImage.length > 0
        ) {
          coverImageLocalPath = (req.files as any).coverImage[0].path;
        }

        // Upload to Cloudinary
        const avatar = await this.cloudinaryService.uploadToCloud(
          avatarLocalPath
        );

        if (!avatar) {
          throw new ApiError(400, 'Avatar file is required');
        }

        let coverImage;
        if (coverImageLocalPath) {
          coverImage = await this.cloudinaryService.uploadToCloud(
            coverImageLocalPath
          );
        }

        // Create user
        const user = await User.create({
          fullName,
          avatar: avatar.url,
          coverImage: coverImage?.url || '',
          email,
          password,
          username: username.toLowerCase(),
        });

        // Fetch created user without sensitive fields
        const createdUser = await User.findById(user._id).select(
          '-password -refreshToken'
        );

        if (!createdUser) {
          throw new ApiError(500, 'Something went wrong while registering');
        }

        this.sendSuccess(
          res,
          201,
          createdUser,
          'User registered successfully'
        );
      } catch (error) {
        this.handleError(error, res);
      }
    }
  );

  /**
   * Login user
   * POST /api/v1/users/login
   */
  loginUser = asyncHandler(
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        const { username, email, password } = req.body as LoginUserRequest;

        if (!username && !email) {
          throw new ApiError(400, 'Username or email is required');
        }

        if (!password) {
          throw new ApiError(400, 'Password is required');
        }

        // Find user
        const user = await User.findOne({
          $or: [{ username }, { email }],
        });

        if (!user) {
          throw new ApiError(404, 'User not found');
        }

        // Check password
        const isPasswordValid = await user.isPasswordCorrect(password);

        if (!isPasswordValid) {
          throw new ApiError(401, 'Invalid user credentials');
        }

        // Generate tokens
        const { accessToken, refreshToken } =
          await this.generateAccessAndRefreshTokens(user._id.toString());

        // Get user without sensitive fields
        const loggedInUser = await User.findById(user._id).select(
          '-password -refreshToken'
        );

        // Set cookies
        const cookieOptions = {
          httpOnly: true,
          secure: true,
          sameSite: 'strict' as const,
        };

        res
          .status(200)
          .cookie('accessToken', accessToken, cookieOptions)
          .cookie('refreshToken', refreshToken, cookieOptions)
          .json(
            new ApiResponse(200, {
              user: loggedInUser,
              accessToken,
              refreshToken,
            }, 'User logged in successfully')
          );
      } catch (error) {
        this.handleError(error, res);
      }
    }
  );

  /**
   * Logout user
   * POST /api/v1/users/logout
   */
  logoutUser = asyncHandler(
    async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
      try {
        await User.findByIdAndUpdate(req.user?._id, { refreshToken: null });

        const cookieOptions = {
          httpOnly: true,
          secure: true,
          sameSite: 'strict' as const,
        };

        res
          .status(200)
          .clearCookie('accessToken', cookieOptions)
          .clearCookie('refreshToken', cookieOptions)
          .json(new ApiResponse(200, {}, 'User logged out successfully'));
      } catch (error) {
        this.handleError(error, res);
      }
    }
  );

  /**
   * Refresh access token
   * POST /api/v1/users/refresh-token
   */
  refreshAccessToken = asyncHandler(
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        const incomingRefreshToken =
          req.cookies.refreshToken || req.body.refreshToken;

        if (!incomingRefreshToken) {
          throw new ApiError(401, 'Unauthorized request');
        }

        // Decode token and find user
        const decoded = require('jsonwebtoken').verify(
          incomingRefreshToken,
          process.env.REFRESH_TOKEN_SECRET || 'secret'
        ) as any;

        const user = await User.findById(decoded._id);

        if (!user) {
          throw new ApiError(401, 'Invalid refresh token');
        }

        if (incomingRefreshToken !== user.refreshToken) {
          throw new ApiError(401, 'Refresh token is expired or used');
        }

        // Generate new tokens
        const { accessToken, refreshToken } =
          await this.generateAccessAndRefreshTokens(user._id.toString());

        const cookieOptions = {
          httpOnly: true,
          secure: true,
          sameSite: 'strict' as const,
        };

        res
          .status(200)
          .cookie('accessToken', accessToken, cookieOptions)
          .cookie('refreshToken', refreshToken, cookieOptions)
          .json(
            new ApiResponse(
              200,
              { accessToken, refreshToken },
              'Access token refreshed'
            )
          );
      } catch (error) {
        this.handleError(error, res);
      }
    }
  );

  /**
   * Get user channel profile
   * GET /api/v1/users/:username
   */
  getUserChannelProfile = asyncHandler(
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        const { username } = req.params;

        if (!username?.trim()) {
          throw new ApiError(400, 'Username is required');
        }

        const channel = await User.aggregate([
          {
            $match: { username: username.toLowerCase() },
          },
          {
            $lookup: {
              from: 'subscriptions',
              localField: '_id',
              foreignField: 'channel',
              as: 'subscribers',
            },
          },
          {
            $lookup: {
              from: 'subscriptions',
              localField: '_id',
              foreignField: 'subscriber',
              as: 'subscribedTo',
            },
          },
          {
            $addFields: {
              subscribersCount: { $size: '$subscribers' },
              channelsSubscribedToCount: { $size: '$subscribedTo' },
              isSubscribed: {
                $cond: [
                  { $in: [{ $toObjectId: (req as AuthenticatedRequest).user?._id }, '$subscribers.subscriber'] },
                  true,
                  false,
                ],
              },
            },
          },
          {
            $project: {
              fullName: 1,
              username: 1,
              subscribersCount: 1,
              channelsSubscribedToCount: 1,
              isSubscribed: 1,
              avatar: 1,
              coverImage: 1,
              email: 1,
            },
          },
        ]);

        if (!channel?.length) {
          throw new ApiError(404, 'Channel not found');
        }

        this.sendSuccess(
          res,
          200,
          channel[0],
          'User channel fetched successfully'
        );
      } catch (error) {
        this.handleError(error, res);
      }
    }
  );

  /**
   * Change current password
   * PUT /api/v1/users/changepassword
   */
  changeCurrentPassword = asyncHandler(
    async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
      try {
        const { oldPassword, newPassword } = req.body;

        if (!oldPassword || !newPassword) {
          throw new ApiError(400, 'Old and new passwords are required');
        }

        const user = await User.findById(req.user?._id);

        if (!user) {
          throw new ApiError(404, 'User not found');
        }

        const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

        if (!isPasswordCorrect) {
          throw new ApiError(400, 'Invalid old password');
        }

        user.password = newPassword;
        await user.save({ validateBeforeSave: false });

        this.sendSuccess(res, 200, {}, 'Password changed successfully');
      } catch (error) {
        this.handleError(error, res);
      }
    }
  );

  /**
   * Authenticate user
   * GET /api/v1/users/authenticateStatus
   */
  authenticateUser = asyncHandler(
    async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
      try {
        const user = await User.findById(req.user?._id).select(
          '-password -refreshToken'
        );

        if (!user) {
          throw new ApiError(401, 'User not authenticated');
        }

        this.sendSuccess(res, 200, user, 'User is authenticated');
      } catch (error) {
        this.handleError(error, res);
      }
    }
  );

  /**
   * Delete watch history
   * DELETE /api/v1/users/deleteHistory
   */
  deleteHistory = asyncHandler(
    async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
      try {
        await User.findByIdAndUpdate(req.user?._id, { watchHistory: [] });

        this.sendSuccess(res, 200, {}, 'Watch history deleted');
      } catch (error) {
        this.handleError(error, res);
      }
    }
  );

  // Helper method
  private async generateAccessAndRefreshTokens(
    userId: string
  ): Promise<{ accessToken: string; refreshToken: string }> {
    try {
      const user = await User.findById(userId);

      if (!user) {
        throw new ApiError(404, 'User not found');
      }

      const accessToken = user.generateAccessToken();
      const refreshToken = user.generateRefreshToken();

      user.refreshToken = refreshToken;
      await user.save({ validateBeforeSave: false });

      return { accessToken, refreshToken };
    } catch (error) {
      throw new ApiError(
        500,
        'Something went wrong while generating tokens'
      );
    }
  }
}
```

---

## Phase 3: Video Controller

### Create controllers/video.controller.ts

```typescript
// src/controllers/video.controller.ts
import { Request, Response, NextFunction } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/ApiError';
import { ApiResponse } from '../utils/ApiResponse';
import { Video } from '../models/video.model';
import { User } from '../models/user.model';
import { CloudinaryService } from '../services/CloudinaryService';
import { BaseController } from '../base/BaseController';
import { AuthenticatedRequest, FileUploadRequest } from '../types/middleware.types';

export class VideoController extends BaseController {
  private cloudinaryService = CloudinaryService;

  /**
   * Create video
   * POST /api/v1/videos
   */
  createVideo = asyncHandler(
    async (req: FileUploadRequest, res: Response, next: NextFunction): Promise<void> => {
      try {
        const { title, description } = req.body;
        const userId = (req as AuthenticatedRequest).user?._id;

        if (!title?.trim() || !description?.trim()) {
          throw new ApiError(400, 'Title and description are required');
        }

        let videoFileLocalPath;
        let thumbnailLocalPath;

        if (req.files && typeof req.files === 'object') {
          const files = req.files as any;
          if (Array.isArray(files.videoFile) && files.videoFile.length > 0) {
            videoFileLocalPath = files.videoFile[0].path;
          }
          if (Array.isArray(files.thumbnail) && files.thumbnail.length > 0) {
            thumbnailLocalPath = files.thumbnail[0].path;
          }
        }

        if (!videoFileLocalPath) {
          throw new ApiError(400, 'Video file is required');
        }
        if (!thumbnailLocalPath) {
          throw new ApiError(400, 'Thumbnail is required');
        }

        // Upload to Cloudinary
        const videoFile = await this.cloudinaryService.uploadToCloud(
          videoFileLocalPath
        );
        const thumbnail = await this.cloudinaryService.uploadToCloud(
          thumbnailLocalPath
        );

        if (!videoFile || !thumbnail) {
          throw new ApiError(500, 'Failed to upload files');
        }

        // Create video
        const video = await Video.create({
          videoFile: videoFile.url,
          thumbnail: thumbnail.url,
          title,
          description,
          duration: 0, // Should be calculated from video
          owner: userId,
        });

        this.sendSuccess(res, 201, video, 'Video created successfully');
      } catch (error) {
        this.handleError(error, res);
      }
    }
  );

  /**
   * Get video by ID
   * GET /api/v1/videos/:videoId
   */
  getVideoById = asyncHandler(
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        const { videoId } = req.params;

        if (!videoId) {
          throw new ApiError(400, 'Video ID is required');
        }

        const video = await Video.findById(videoId).populate('owner');

        if (!video) {
          throw new ApiError(404, 'Video not found');
        }

        // Increment views
        await video.incrementViews();

        this.sendSuccess(res, 200, video, 'Video fetched successfully');
      } catch (error) {
        this.handleError(error, res);
      }
    }
  );

  /**
   * Get all videos with pagination
   * GET /api/v1/videos?page=1&limit=10
   */
  getAllVideos = asyncHandler(
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;

        const videos = await Video.aggregate([
          { $match: { isPublished: true } },
          { $sort: { createdAt: -1 } },
          { $skip: (page - 1) * limit },
          { $limit: limit },
          {
            $lookup: {
              from: 'users',
              localField: 'owner',
              foreignField: '_id',
              as: 'owner',
            },
          },
          {
            $unwind: '$owner',
          },
        ]);

        const totalVideos = await Video.countDocuments({ isPublished: true });

        this.sendSuccess(
          res,
          200,
          {
            videos,
            totalVideos,
            page,
            limit,
            totalPages: Math.ceil(totalVideos / limit),
          },
          'Videos fetched successfully'
        );
      } catch (error) {
        this.handleError(error, res);
      }
    }
  );

  /**
   * Update video
   * PATCH /api/v1/videos/:videoId
   */
  updateVideo = asyncHandler(
    async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
      try {
        const { videoId } = req.params;
        const { title, description, isPublished } = req.body;

        const video = await Video.findById(videoId);

        if (!video) {
          throw new ApiError(404, 'Video not found');
        }

        if (video.owner.toString() !== req.user?._id.toString()) {
          throw new ApiError(403, 'Unauthorized to update this video');
        }

        if (title) video.title = title;
        if (description) video.description = description;
        if (isPublished !== undefined) video.isPublished = isPublished;

        await video.save();

        this.sendSuccess(res, 200, video, 'Video updated successfully');
      } catch (error) {
        this.handleError(error, res);
      }
    }
  );

  /**
   * Delete video
   * DELETE /api/v1/videos/:videoId
   */
  deleteVideo = asyncHandler(
    async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
      try {
        const { videoId } = req.params;

        const video = await Video.findById(videoId);

        if (!video) {
          throw new ApiError(404, 'Video not found');
        }

        if (video.owner.toString() !== req.user?._id.toString()) {
          throw new ApiError(403, 'Unauthorized to delete this video');
        }

        await Video.findByIdAndDelete(videoId);

        this.sendSuccess(res, 200, {}, 'Video deleted successfully');
      } catch (error) {
        this.handleError(error, res);
      }
    }
  );

  /**
   * Get user videos
   * GET /api/v1/videos/user/:userId
   */
  getUserVideos = asyncHandler(
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        const { userId } = req.params;
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;

        const videos = await Video.find({ owner: userId, isPublished: true })
          .sort({ createdAt: -1 })
          .skip((page - 1) * limit)
          .limit(limit);

        const totalVideos = await Video.countDocuments({
          owner: userId,
          isPublished: true,
        });

        this.sendSuccess(
          res,
          200,
          {
            videos,
            totalVideos,
            page,
            limit,
          },
          'User videos fetched'
        );
      } catch (error) {
        this.handleError(error, res);
      }
    }
  );
}

// Export instance for ease of use
export const videoController = new VideoController();
```

---

## Phase 4: Subscription Controller

### Create controllers/subscription.controller.ts

```typescript
// src/controllers/subscription.controller.ts
import { Request, Response, NextFunction } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/ApiError';
import { ApiResponse } from '../utils/ApiResponse';
import { Subscription } from '../models/subscription.model';
import { BaseController } from '../base/BaseController';
import { AuthenticatedRequest } from '../types/middleware.types';

export class SubscriptionController extends BaseController {
  /**
   * Toggle subscription
   * POST /api/v1/subscriptions/:channelId
   */
  toggleSubscription = asyncHandler(
    async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
      try {
        const { channelId } = req.params;
        const subscriberId = req.user?._id;

        if (!channelId) {
          throw new ApiError(400, 'Channel ID is required');
        }

        const subscription = await Subscription.findOne({
          subscriber: subscriberId,
          channel: channelId,
        });

        if (subscription) {
          // Unsubscribe
          await Subscription.findByIdAndDelete(subscription._id);
          this.sendSuccess(
            res,
            200,
            { isSubscribed: false },
            'Unsubscribed successfully'
          );
        } else {
          // Subscribe
          const newSubscription = await Subscription.create({
            subscriber: subscriberId,
            channel: channelId,
          });

          this.sendSuccess(
            res,
            200,
            { isSubscribed: true },
            'Subscribed successfully'
          );
        }
      } catch (error) {
        this.handleError(error, res);
      }
    }
  );

  /**
   * Get channel subscribers
   * GET /api/v1/subscriptions/channel/:channelId
   */
  getChannelSubscribers = asyncHandler(
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        const { channelId } = req.params;

        const subscribers = await Subscription.find({ channel: channelId })
          .populate('subscriber', 'username avatar')
          .lean();

        const totalSubscribers = subscribers.length;

        this.sendSuccess(
          res,
          200,
          { subscribers, totalSubscribers },
          'Channel subscribers fetched'
        );
      } catch (error) {
        this.handleError(error, res);
      }
    }
  );

  /**
   * Get subscriber's channels
   * GET /api/v1/subscriptions/user/:userId
   */
  getSubscriberChannels = asyncHandler(
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        const { userId } = req.params;

        const channels = await Subscription.find({ subscriber: userId })
          .populate('channel', 'username avatar')
          .lean();

        this.sendSuccess(
          res,
          200,
          { channels, totalChannels: channels.length },
          'Subscriber channels fetched'
        );
      } catch (error) {
        this.handleError(error, res);
      }
    }
  );

  /**
   * Check subscription status
   * GET /api/v1/subscriptions/check/:channelId
   */
  checkSubscriptionStatus = asyncHandler(
    async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
      try {
        const { channelId } = req.params;

        const subscription = await Subscription.findOne({
          subscriber: req.user?._id,
          channel: channelId,
        });

        this.sendSuccess(
          res,
          200,
          { isSubscribed: !!subscription },
          'Subscription status checked'
        );
      } catch (error) {
        this.handleError(error, res);
      }
    }
  );
}

export const subscriptionController = new SubscriptionController();
```

---

## Checklist for Person 4 Completion

- [ ] src/types/controller.types.ts created
- [ ] src/controllers/user.controller.ts converted (all methods working)
- [ ] src/controllers/video.controller.ts converted (CRUD operations)
- [ ] src/controllers/subscription.controller.ts converted
- [ ] All controllers extend BaseController
- [ ] All async handlers work correctly
- [ ] All error cases handled
- [ ] TypeScript compilation succeeds
- [ ] No type errors in controllers

---

## Important Notes

1. **Dependency Injection**: Services injected via private properties
2. **Error Handling**: Use BaseController methods for consistent responses
3. **Async Handlers**: All routes wrapped with asyncHandler
4. **Type Safety**: Use proper TypeScript types instead of `any`
5. **Middleware Access**: Use AuthenticatedRequest for protected routes
6. **File Uploads**: FileUploadRequest type provides typed file access

---

## Tips for Success

- Keep controller methods focused on HTTP handling only
- Delegate business logic to service classes
- Use consistent error messages
- Test each endpoint before passing to Person 5
- Ensure all TypeScript errors are resolved
