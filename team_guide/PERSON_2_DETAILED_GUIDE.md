# Person 2: Models & Database Layer - Detailed Guide

## Phase 1: Understand Current Models Structure

Review the current models in JavaScript to understand:
- User model: authentication, tokens, password hashing
- Video model: video metadata, aggregation pipelines
- Subscription model: subscription relationships

---

## Phase 2: Create Type Definitions

### Step 1: Create types/user.types.ts

```typescript
// src/types/user.types.ts
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

export interface UserDTO {
  username: string;
  email: string;
  fullName: string;
  password: string;
  avatar: string;
  coverImage?: string;
}

export interface LoginDTO {
  username: string;
  email?: string;
  password: string;
}
```

### Step 2: Create types/video.types.ts

```typescript
// src/types/video.types.ts
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
```

### Step 3: Create types/subscription.types.ts

```typescript
// src/types/subscription.types.ts
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
```

---

## Phase 3: Create Base Model Class

### Step 1: Create BaseModel.ts

```typescript
// src/models/BaseModel.ts
import { Document, Model, Schema } from 'mongoose';
import mongoose from 'mongoose';

export abstract class BaseModel<T extends Document> {
  protected model: Model<T>;

  constructor(model: Model<T>) {
    this.model = model;
  }

  async create(data: Partial<T>): Promise<T> {
    return await this.model.create(data);
  }

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
```

---

## Phase 4: Convert User Model

### Step 1: Create user.model.ts

```typescript
// src/models/user.model.ts
import mongoose, { Schema, Document, Model } from 'mongoose';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import mongooseAggregatePaginate from 'mongoose-aggregate-paginate-v2';
import { IUser } from '../types/user.types';

interface IUserModel extends Model<IUser> {
  findByUsername(username: string): Promise<IUser | null>;
  findByEmail(email: string): Promise<IUser | null>;
}

const userSchema = new Schema<IUser>(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      unique: true,
      trim: true,
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    avatar: {
      type: String,
      required: true,
    },
    coverImage: {
      type: String,
    },
    watchHistory: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Video',
      },
    ],
    password: {
      type: String,
      required: [true, 'Password is required'],
    },
    refreshToken: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save hook to hash password
userSchema.pre<IUser>('save', async function (next) {
  if (!this.isModified('password')) return next();

  try {
    const hashedPassword = await bcrypt.hash(this.password, 10);
    this.password = hashedPassword;
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Instance method: Check password
userSchema.methods.isPasswordCorrect = async function (
  password: string
): Promise<boolean> {
  return await bcrypt.compare(password, this.password);
};

// Instance method: Generate access token
userSchema.methods.generateAccessToken = function (): string {
  return jwt.sign(
    {
      _id: this._id,
      email: this.email,
      username: this.username,
      fullName: this.fullName,
    },
    process.env.ACCESS_TOKEN_SECRET || 'secret',
    { expiresIn: process.env.ACCESS_TOKEN_EXPIRY || '1d' }
  );
};

// Instance method: Generate refresh token
userSchema.methods.generateRefreshToken = function (): string {
  return jwt.sign(
    {
      _id: this._id,
    },
    process.env.REFRESH_TOKEN_SECRET || 'secret',
    { expiresIn: process.env.REFRESH_TOKEN_EXPIRY || '10d' }
  );
};

// Static method: Find by username
userSchema.static('findByUsername', async function (
  username: string
): Promise<IUser | null> {
  return await this.findOne({ username: username.toLowerCase() });
});

// Static method: Find by email
userSchema.static('findByEmail', async function (
  email: string
): Promise<IUser | null> {
  return await this.findOne({ email: email.toLowerCase() });
});

// Plugin for pagination with aggregation
userSchema.plugin(mongooseAggregatePaginate);

export const User = mongoose.model<IUser, IUserModel>('User', userSchema);
```

---

## Phase 5: Convert Video Model

### Step 1: Create video.model.ts

```typescript
// src/models/video.model.ts
import mongoose, { Schema, Document, Model } from 'mongoose';
import mongooseAggregatePaginate from 'mongoose-aggregate-paginate-v2';
import { IVideo } from '../types/video.types';

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

// Instance method: Increment views
videoSchema.methods.incrementViews = async function (): Promise<void> {
  this.views += 1;
  await this.save();
};

// Static method: Find published videos
videoSchema.static('findPublished', async function (): Promise<IVideo[]> {
  return await this.find({ isPublished: true });
});

// Static method: Find videos by owner
videoSchema.static(
  'findByOwner',
  async function (ownerId: string): Promise<IVideo[]> {
    return await this.find({ owner: ownerId });
  }
);

// Plugin for pagination
videoSchema.plugin(mongooseAggregatePaginate);

export const Video = mongoose.model<IVideo, IVideoModel>('Video', videoSchema);
```

---

## Phase 6: Convert Subscription Model

### Step 1: Create subscription.model.ts

```typescript
// src/models/subscription.model.ts
import mongoose, { Schema, Document, Model } from 'mongoose';
import { ISubscription } from '../types/subscription.types';

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
    subscriber: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
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
subscriptionSchema.index({ subscriber: 1, channel: 1 }, { unique: true });

// Static method: Find by subscriber and channel
subscriptionSchema.static(
  'findBySubscriberAndChannel',
  async function (
    subscriberId: string,
    channelId: string
  ): Promise<ISubscription | null> {
    return await this.findOne({
      subscriber: subscriberId,
      channel: channelId,
    });
  }
);

// Static method: Get channel subscribers
subscriptionSchema.static(
  'findChannelSubscribers',
  async function (channelId: string): Promise<ISubscription[]> {
    return await this.find({ channel: channelId }).populate('subscriber');
  }
);

// Static method: Get subscriber's channels
subscriptionSchema.static(
  'findSubscriberChannels',
  async function (subscriberId: string): Promise<ISubscription[]> {
    return await this.find({ subscriber: subscriberId }).populate('channel');
  }
);

// Static method: Get subscriber count
subscriptionSchema.static(
  'getSubscriberCount',
  async function (channelId: string): Promise<number> {
    return await this.countDocuments({ channel: channelId });
  }
);

export const Subscription = mongoose.model<ISubscription, ISubscriptionModel>(
  'Subscription',
  subscriptionSchema
);
```

---

## Phase 7: Additional Type Safety

### Create types/index.ts

```typescript
// src/types/index.ts
export * from './user.types';
export * from './video.types';
export * from './subscription.types';
```

---

## Models Service Classes (Optional but Recommended)

### Create service classes to encapsulate model operations

```typescript
// src/services/UserModelService.ts
import { User } from '../models/user.model';
import { IUser, UserDTO } from '../types/user.types';
import { ApiError } from '../utils/ApiError';

export class UserModelService {
  async registerUser(userData: UserDTO): Promise<IUser> {
    const existingUser = await User.findOne({
      $or: [{ username: userData.username }, { email: userData.email }],
    });

    if (existingUser) {
      throw new ApiError(409, 'User with email or username already exists');
    }

    const user = await User.create(userData);
    return user;
  }

  async findUserByUsername(username: string): Promise<IUser | null> {
    return await User.findOne({ username: username.toLowerCase() });
  }

  async findUserByEmail(email: string): Promise<IUser | null> {
    return await User.findOne({ email: email.toLowerCase() });
  }

  async findUserById(userId: string): Promise<IUser | null> {
    return await User.findById(userId);
  }

  async updateRefreshToken(userId: string, token: string): Promise<void> {
    await User.findByIdAndUpdate(userId, { refreshToken: token });
  }

  async clearRefreshToken(userId: string): Promise<void> {
    await User.findByIdAndUpdate(userId, { refreshToken: null });
  }
}
```

---

## Checklist for Person 2 Completion

- [ ] src/types/ folder created with all type definitions
  - [ ] user.types.ts
  - [ ] video.types.ts
  - [ ] subscription.types.ts
  - [ ] types/index.ts
- [ ] src/models/BaseModel.ts created
- [ ] src/models/user.model.ts converted (with all hooks and methods)
- [ ] src/models/video.model.ts converted (with pagination support)
- [ ] src/models/subscription.model.ts converted (with unique index)
- [ ] All static methods implemented
- [ ] All instance methods implemented
- [ ] TypeScript compilation succeeds: `npm run build`
- [ ] No type errors: `npm run typecheck`
- [ ] (Optional) Service classes created for each model

---

## Important Notes

1. **Hook Execution**: Pre-save hooks still run before saving to DB
2. **Password Hashing**: Happens in pre-save hook - no change in functionality
3. **Token Generation**: JWT tokens generated same way, just using TypeScript
4. **Pagination**: mongoose-aggregate-paginate-v2 plugin still used
5. **Timestamps**: Automatically added by Mongoose `timestamps: true`
6. **Indexes**: Unique and compound indexes work as before
7. **References**: Population of references (ref: 'User') works same way

---

## Tips for Success

- Always use proper TypeScript types instead of `any`
- Test schema creation with sample data
- Verify all Mongoose methods work as expected
- Use type inference where appropriate
- Keep models focused on data and schema only
- Move business logic to Service classes (optional but good practice)
