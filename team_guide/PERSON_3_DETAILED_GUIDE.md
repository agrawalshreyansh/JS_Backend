# Person 3: Middlewares & Utilities - Detailed Guide

## Overview
Convert middleware functions to class-based architecture with TypeScript types. All Utility services become class-based.

---

## Phase 1: Create Middleware Types

### Create types/middleware.types.ts

```typescript
// src/types/middleware.types.ts
import { Request, Response, NextFunction } from 'express';

export interface AuthenticatedRequest extends Request {
  user?: any; // Will be typed with IUser after Person 2
  token?: string;
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortType?: 'asc' | 'desc';
}

export interface FileUploadRequest extends Request {
  files?: {
    avatar?: Express.Multer.File[];
    coverImage?: Express.Multer.File[];
    videoFile?: Express.Multer.File[];
    thumbnail?: Express.Multer.File[];
  };
  file?: Express.Multer.File;
}
```

---

## Phase 2: Authentication Middleware

### Step 1: Create auth.middleware.ts

```typescript
// src/middlewares/auth.middleware.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { ApiError } from '../utils/ApiError';
import { asyncHandler } from '../utils/asyncHandler';
import { User } from '../models/user.model';
import { AuthenticatedRequest } from '../types/middleware.types';

interface JWTPayload {
  _id: string;
  email: string;
  username: string;
  fullName: string;
}

export class AuthMiddleware {
  static verifyJWT = asyncHandler(
    async (
      req: AuthenticatedRequest,
      res: Response,
      next: NextFunction
    ): Promise<void> => {
      try {
        const token =
          req.cookies?.accessToken ||
          req.header('Authorization')?.replace('Bearer ', '');

        if (!token) {
          throw new ApiError(401, 'Unauthorized request - No token provided');
        }

        const decodedToken = jwt.verify(
          token,
          process.env.ACCESS_TOKEN_SECRET || 'secret'
        ) as JWTPayload;

        if (!decodedToken) {
          throw new ApiError(401, 'Invalid token');
        }

        const user = await User.findById(decodedToken._id).select(
          '-password -refreshToken'
        );

        if (!user) {
          throw new ApiError(401, 'Invalid Access Token');
        }

        req.user = user;
        next();
      } catch (error: any) {
        throw new ApiError(401, error?.message || 'Invalid access token');
      }
    }
  );

  static verifyAdmin = asyncHandler(
    async (
      req: AuthenticatedRequest,
      res: Response,
      next: NextFunction
    ): Promise<void> => {
      AuthMiddleware.verifyJWT(req, res, () => {
        // After JWT verification, check admin role (if applicable)
        next();
      });
    }
  );
}
```

### Step 2: Create optionalAuth.middleware.ts

```typescript
// src/middlewares/optionalAuth.middleware.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/user.model';
import { asyncHandler } from '../utils/asyncHandler';
import { AuthenticatedRequest } from '../types/middleware.types';

interface JWTPayload {
  _id: string;
  email: string;
  username: string;
  fullName: string;
}

export class OptionalAuthMiddleware {
  static verifyJWTOptionally = asyncHandler(
    async (
      req: AuthenticatedRequest,
      res: Response,
      next: NextFunction
    ): Promise<void> => {
      try {
        const token =
          req.cookies?.accessToken ||
          req.header('Authorization')?.replace('Bearer ', '');

        if (token) {
          try {
            const decodedToken = jwt.verify(
              token,
              process.env.ACCESS_TOKEN_SECRET || 'secret'
            ) as JWTPayload;

            const user = await User.findById(decodedToken._id).select(
              '-password -refreshToken'
            );

            if (user) {
              req.user = user;
            }
          } catch (error) {
            // Token validation failed, but continue without user
            // (optional auth)
          }
        }

        next();
      } catch (error) {
        // Ensure we always proceed even on error
        next();
      }
    }
  );
}
```

---

## Phase 3: Error Handling Middleware

### Create errors.middleware.ts

```typescript
// src/middlewares/errors.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/ApiError';

export class ErrorHandler {
  static handle = (
    error: Error | ApiError,
    req: Request,
    res: Response,
    next: NextFunction
  ): void => {
    let statusCode = 500;
    let message = 'Internal Server Error';
    let errors: any[] = [];
    let data: any = null;

    if (error instanceof ApiError) {
      statusCode = error.statusCode;
      message = error.message;
      errors = error.errors;
      data = error.data;
    } else if (error instanceof Error) {
      message = error.message;
    }

    // Log error in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error:', {
        statusCode,
        message,
        stack: error.stack,
      });
    }

    res.status(statusCode).json({
      statusCode,
      data,
      message,
      success: false,
      errors,
    });
  };
}

// Export as middleware function
export default ErrorHandler.handle;
```

---

## Phase 4: File Upload Middleware

### Step 1: Create multer.middleware.ts

```typescript
// src/middlewares/multer.middleware.ts
import multer, { StorageEngine, FileFilterCallback } from 'multer';
import path from 'path';
import fs from 'fs';
import { Request } from 'express';

type DestinationCallback = (error: Error | null, destination: string) => void;
type FileNameCallback = (error: Error | null, filename: string) => void;

export class FileUploadMiddleware {
  private static storage: StorageEngine = multer.diskStorage({
    destination: function (
      req: Request,
      file: Express.Multer.File,
      cb: DestinationCallback
    ): void {
      const uploadDir = path.join(process.cwd(), 'public', 'temp');

      // Create directory if it doesn't exist
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      cb(null, uploadDir);
    },

    filename: function (
      req: Request,
      file: Express.Multer.File,
      cb: FileNameCallback
    ): void {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      cb(
        null,
        file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname)
      );
    },
  });

  private static fileFilter = (
    req: Request,
    file: Express.Multer.File,
    cb: FileFilterCallback
  ): void => {
    const allowedMimes = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'video/mp4',
      'video/quicktime',
    ];

    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new Error(
          `Invalid file type. Allowed types: ${allowedMimes.join(', ')}`
        )
      );
    }
  };

  static upload = multer({
    storage: FileUploadMiddleware.storage,
    fileFilter: FileUploadMiddleware.fileFilter,
    limits: {
      fileSize: 100 * 1024 * 1024, // 100 MB
    },
  });

  static uploadFields = (fields: multer.Field[]) => {
    return FileUploadMiddleware.upload.fields(fields);
  };

  static uploadSingle = (fieldName: string) => {
    return FileUploadMiddleware.upload.single(fieldName);
  };
}

// Export convenience function
export const upload = FileUploadMiddleware.upload;
```

---

## Phase 5: Cloudinary Service

### Create CloudinaryService.ts

```typescript
// src/services/CloudinaryService.ts
import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import { ApiError } from '../utils/ApiError';

export interface CloudinaryUploadResponse {
  url: string;
  publicId: string;
  secureUrl: string;
}

export class CloudinaryService {
  static {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }

  static async uploadToCloud(
    localFilePath: string
  ): Promise<CloudinaryUploadResponse> {
    try {
      if (!localFilePath) {
        throw new ApiError(400, 'Local file path is required');
      }

      const response = await cloudinary.uploader.upload(localFilePath, {
        resource_type: 'auto',
      });

      // Remove local file after successful upload
      if (fs.existsSync(localFilePath)) {
        fs.unlinkSync(localFilePath);
      }

      return {
        url: response.url,
        publicId: response.public_id,
        secureUrl: response.secure_url,
      };
    } catch (error) {
      // Delete local file if upload fails
      if (localFilePath && fs.existsSync(localFilePath)) {
        fs.unlinkSync(localFilePath);
      }

      if (error instanceof ApiError) {
        throw error;
      }

      throw new ApiError(
        500,
        `Failed to upload file to Cloudinary: ${(error as Error).message}`
      );
    }
  }

  static async deleteFromCloud(publicId: string): Promise<void> {
    try {
      if (!publicId) {
        throw new ApiError(400, 'Public ID is required');
      }

      await cloudinary.uploader.destroy(publicId);
    } catch (error) {
      throw new ApiError(
        500,
        `Failed to delete file from Cloudinary: ${(error as Error).message}`
      );
    }
  }

  static async getOptimizedUrl(
    publicId: string,
    options?: any
  ): Promise<string> {
    try {
      const url = cloudinary.url(publicId, {
        fetch_format: 'auto',
        quality: 'auto',
        ...options,
      });

      return url;
    } catch (error) {
      throw new ApiError(
        500,
        `Failed to generate optimized URL: ${(error as Error).message}`
      );
    }
  }
}

// For backward compatibility, export as function
export const uploadOnCloud = (filePath: string) =>
  CloudinaryService.uploadToCloud(filePath);
```

---

## Phase 6: Email Service

### Create EmailService.ts

```typescript
// src/services/EmailService.ts
import nodemailer from 'nodemailer';
import { ApiError } from '../utils/ApiError';

export interface EmailOptions {
  to: string;
  subject: string;
  html?: string;
  text?: string;
}

export class EmailService {
  private static transporter: nodemailer.Transporter | null = null;

  private static getTransporter(): nodemailer.Transporter {
    if (!EmailService.transporter) {
      EmailService.transporter = nodemailer.createTransport({
        service: 'gmail', // or your email service
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD,
        },
      });
    }

    return EmailService.transporter;
  }

  static async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
        throw new ApiError(
          500,
          'Email configuration is missing in environment variables'
        );
      }

      const transporter = EmailService.getTransporter();

      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: options.to,
        subject: options.subject,
        html: options.html || '',
        text: options.text || '',
      };

      const info = await transporter.sendMail(mailOptions);

      console.log('Email sent:', info.messageId);
      return true;
    } catch (error) {
      console.error('Email send error:', error);
      throw new ApiError(
        500,
        `Failed to send email: ${(error as Error).message}`
      );
    }
  }

  static async sendPasswordResetEmail(
    email: string,
    resetToken: string
  ): Promise<boolean> {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

    const htmlTemplate = `
      <h2>Password Reset Request</h2>
      <p>You requested a password reset. Click the link below to reset your password:</p>
      <a href="${resetUrl}">Reset Password</a>
      <p>This link expires in 1 hour.</p>
    `;

    return await EmailService.sendEmail({
      to: email,
      subject: 'Password Reset Request',
      html: htmlTemplate,
    });
  }

  static async sendVerificationEmail(
    email: string,
    verificationToken: string
  ): Promise<boolean> {
    const verifyUrl = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;

    const htmlTemplate = `
      <h2>Email Verification</h2>
      <p>Please verify your email by clicking the link below:</p>
      <a href="${verifyUrl}">Verify Email</a>
    `;

    return await EmailService.sendEmail({
      to: email,
      subject: 'Email Verification',
      html: htmlTemplate,
    });
  }
}

// For backward compatibility
export const sendEmail = (options: EmailOptions) =>
  EmailService.sendEmail(options);
```

---

## Phase 7: Keep-Alive Service

### Create utils/KeepAliveService.ts

```typescript
// src/utils/KeepAliveService.ts
import cron from 'node-cron';
import axios from 'axios';

export class KeepAliveService {
  private cronJob: cron.ScheduledTask | null = null;
  private serverUrl: string;

  constructor(serverUrl: string) {
    this.serverUrl = serverUrl;
  }

  start(): void {
    // Run every 30 minutes
    this.cronJob = cron.schedule('*/30 * * * *', async () => {
      try {
        console.log(`[${new Date().toISOString()}] Keep-alive ping to server`);
        await axios.get(`${this.serverUrl}/api/v1/health`);
        console.log(
          `[${new Date().toISOString()}] Keep-alive ping successful`
        );
      } catch (error) {
        console.error(
          `[${new Date().toISOString()}] Keep-alive ping failed:`,
          error
        );
      }
    });

    console.log('✓ Keep-alive service started');
  }

  stop(): void {
    if (this.cronJob) {
      this.cronJob.stop();
      console.log('✓ Keep-alive service stopped');
    }
  }
}

// For backward compatibility
export const startKeepAliveJob = (serverUrl: string) => {
  const service = new KeepAliveService(serverUrl);
  service.start();
};
```

---

## Checklist for Person 3 Completion

- [ ] src/types/middleware.types.ts created
- [ ] src/middlewares/auth.middleware.ts converted (with JWT verification)
- [ ] src/middlewares/optionalAuth.middleware.ts converted
- [ ] src/middlewares/errors.middleware.ts created (global error handler)
- [ ] src/middlewares/multer.middleware.ts converted (file upload)
- [ ] src/services/CloudinaryService.ts created
- [ ] src/services/EmailService.ts created
- [ ] src/utils/KeepAliveService.ts created
- [ ] All middlewares return proper error types
- [ ] TypeScript compilation succeeds
- [ ] No type errors in middleware

---

## Important Notes for Person 3

1. **Middleware Binding**: Use `.bind(this)` when passing class methods to Express
2. **Static Methods**: All middleware are static - no instantiation needed
3. **Error Propagation**: All errors thrown will be caught by the error handler
4. **Cloudinary**: Same configuration, just wrapped in a service class
5. **Email Service**: Optional - only works if email config is present
6. **Keep-Alive**: Runs independently via cron scheduler
7. **File Upload**: Temporary files stored in public/temp directory

---

## Tips for Success

- Maintain backward compatibility - export functions alongside classes
- Use proper TypeScript types for all parameters
- Handle errors gracefully in services
- Test each middleware independently
- Ensure all dependencies are installed (axios for keep-alive)
