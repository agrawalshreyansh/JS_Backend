# Person 1: Core Infrastructure & Config - Detailed Guide

## Phase 1: Setup TypeScript Environment

### Step 1: Update package.json

Replace your scripts section with:
```json
"scripts": {
  "dev": "ts-node -r dotenv/config --experimental src/index.ts",
  "build": "tsc",
  "start": "node dist/index.js",
  "typecheck": "tsc --noEmit"
}
```

Add TypeScript dependencies to devDependencies:
```json
"devDependencies": {
  "nodemon": "^3.1.9",
  "prettier": "^3.4.2",
  "typescript": "^5.3.3",
  "ts-node": "^10.9.2",
  "@types/node": "^20.10.6",
  "@types/express": "^4.17.21",
  "@types/mongoose": "^7.0.10",
  "@types/cors": "^2.8.17",
  "@types/cookie-parser": "^1.4.7",
  "@types/jsonwebtoken": "^9.0.7",
  "@types/multer": "^1.4.11",
  "@types/bcrypt": "^5.0.2"
}
```

### Step 2: Create tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "lib": ["ES2020"],
    "declaration": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "allowSyntheticDefaultImports": true,
    "moduleResolution": "node",
    "sourceMap": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "noImplicitThis": true,
    "alwaysStrict": true,
    "noUnusedLocals": true,
    "noImplicitReturns": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### Step 3: Add export module in package.json

Keep `"type": "module"` in package.json

---

## Phase 2: Create Base Classes (src/base/)

### Step 1: Create BaseController.ts

```typescript
// src/base/BaseController.ts
import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/ApiError';

export abstract class BaseController {
  protected handleError(error: unknown, res: Response): void {
    if (error instanceof ApiError) {
      res.status(error.statusCode).json({
        statusCode: error.statusCode,
        data: error.data,
        message: error.message,
        success: error.success,
      });
    } else if (error instanceof Error) {
      res.status(500).json({
        statusCode: 500,
        data: null,
        message: error.message,
        success: false,
      });
    } else {
      res.status(500).json({
        statusCode: 500,
        data: null,
        message: 'Unknown error occurred',
        success: false,
      });
    }
  }

  protected sendSuccess(
    res: Response,
    statusCode: number,
    data: any,
    message: string = 'Success'
  ): void {
    res.status(statusCode).json({
      statusCode,
      data,
      message,
      success: true,
    });
  }
}
```

### Step 2: Create BaseService.ts

```typescript
// src/base/BaseService.ts
import { Document, Model, Query } from 'mongoose';

export abstract class BaseService<T extends Document> {
  constructor(protected model: Model<T>) {}

  async create(data: Partial<T>): Promise<T> {
    return await this.model.create(data);
  }

  async findById(id: string): Promise<T | null> {
    return await this.model.findById(id);
  }

  async findOne(filter: any): Promise<T | null> {
    return await this.model.findOne(filter);
  }

  async find(filter: any = {}): Promise<T[]> {
    return await this.model.find(filter);
  }

  async updateById(id: string, data: Partial<T>): Promise<T | null> {
    return await this.model.findByIdAndUpdate(id, data, { new: true });
  }

  async deleteById(id: string): Promise<T | null> {
    return await this.model.findByIdAndDelete(id);
  }

  async findAndUpdate(filter: any, data: Partial<T>): Promise<T | null> {
    return await this.model.findOneAndUpdate(filter, data, { new: true });
  }
}
```

### Step 3: Create BaseError.ts (Enhanced ApiError)

```typescript
// src/base/BaseError.ts
export class BaseError extends Error {
  public readonly statusCode: number;
  public readonly success: boolean;
  public readonly errors: any[];
  public readonly data: any;

  constructor(
    statusCode: number,
    message: string = 'Something went wrong',
    errors: any[] = [],
    data: any = null,
    stack?: string
  ) {
    super(message);
    this.statusCode = statusCode;
    this.message = message;
    this.success = false;
    this.errors = errors;
    this.data = data;

    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }

    Object.setPrototypeOf(this, BaseError.prototype);
  }
}
```

### Step 4: Create BaseRoute.ts

```typescript
// src/base/BaseRoute.ts
import { Router, Request, Response, NextFunction } from 'express';

export abstract class BaseRoute {
  public router: Router;

  constructor() {
    this.router = Router();
    this.setupRoutes();
  }

  abstract setupRoutes(): void;

  protected getRouter(): Router {
    return this.router;
  }
}
```

---

## Phase 3: Convert Utility Files

### Step 1: Convert ApiError.ts

```typescript
// src/utils/ApiError.ts
export class ApiError extends Error {
  statusCode: number;
  data: any;
  message: string;
  success: boolean;
  errors: any[];

  constructor(
    statusCode: number,
    message: string = 'Something went wrong',
    errors: any[] = [],
    stack: string = ''
  ) {
    super(message);
    this.statusCode = statusCode;
    this.data = null;
    this.message = message;
    this.success = false;
    this.errors = errors;

    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }

    Object.setPrototypeOf(this, ApiError.prototype);
  }
}
```

### Step 2: Convert ApiResponse.ts

```typescript
// src/utils/ApiResponse.ts
export interface ApiResponseData {
  statusCode: number;
  data: any;
  message: string;
  success: boolean;
}

export class ApiResponse {
  statusCode: number;
  data: any;
  message: string;
  success: boolean;

  constructor(statusCode: number, data: any, message: string = 'Success') {
    this.statusCode = statusCode;
    this.data = data;
    this.message = message;
    this.success = statusCode < 400;
  }
}
```

### Step 3: Convert asyncHandler.ts

```typescript
// src/utils/asyncHandler.ts
import { Request, Response, NextFunction } from 'express';

type AsyncRequest = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<any>;

export const asyncHandler = (requestHandler: AsyncRequest) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(requestHandler(req, res, next)).catch((error: Error) =>
      next(error)
    );
  };
};
```

---

## Phase 4: Convert Database Connection

### Step 1: Create DatabaseService.ts

```typescript
// src/services/DatabaseService.ts
import mongoose from 'mongoose';

export class DatabaseService {
  private static instance: DatabaseService;

  private constructor() {}

  static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  async connect(): Promise<void> {
    try {
      const mongoUri = process.env.MONGODB_URI || '';
      
      if (!mongoUri) {
        throw new Error('MONGODB_URI is not defined in environment variables');
      }

      await mongoose.connect(mongoUri);
      console.log('✓ Database connected successfully');
    } catch (error) {
      console.error('✗ Database connection failed:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    try {
      await mongoose.disconnect();
      console.log('✓ Database disconnected successfully');
    } catch (error) {
      console.error('✗ Database disconnection failed:', error);
      throw error;
    }
  }

  getConnection(): mongoose.Connection {
    return mongoose.connection;
  }
}
```

---

## Phase 5: Convert App and Server Files

### Step 1: Convert app.ts

```typescript
// src/app.ts
import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import errorHandler from './middlewares/errors.middleware';

interface AppConfig {
  corsOrigin: string;
}

export class AppFactory {
  private app: express.Application;

  constructor(private config: AppConfig) {
    this.app = express();
    this.setupMiddlewares();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  private setupMiddlewares(): void {
    this.app.use(
      cors({
        origin: this.config.corsOrigin,
        credentials: true,
      })
    );

    this.app.use(express.json({ limit: '16mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '20kb' }));
    this.app.use(express.static('public'));
    this.app.use(cookieParser());
  }

  private setupRoutes(): void {
    // Routes will be registered here by Person 5
    // Placeholder for now
  }

  private setupErrorHandling(): void {
    this.app.use(errorHandler);
  }

  getApp(): express.Application {
    return this.app;
  }
}
```

### Step 2: Convert index.ts

```typescript
// src/index.ts
import dotenv from 'dotenv';
import { DatabaseService } from './services/DatabaseService';
import { AppFactory } from './app';
import { KeepAliveService } from './utils/KeepAliveService';

dotenv.config({
  path: '.env',
});

const PORT = process.env.PORT || 8000;
const CORS_ORIGIN = process.env.CORS_ORIGIN || '*';
const SERVER_URL = process.env.SERVER_URL || `http://localhost:${PORT}`;

async function startServer(): Promise<void> {
  try {
    // Initialize database
    const dbService = DatabaseService.getInstance();
    await dbService.connect();

    // Initialize app
    const appFactory = new AppFactory({ corsOrigin: CORS_ORIGIN });
    const app = appFactory.getApp();

    // Start server
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`✓ Server is running on http://localhost:${PORT}`);

      // Start keep-alive service
      const keepAliveService = new KeepAliveService(SERVER_URL);
      keepAliveService.start();
    });
  } catch (error) {
    console.error('✗ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
```

---

## Checklist for Person 1 Completion

- [ ] package.json updated with all TS dependencies
- [ ] tsconfig.json created in root
- [ ] src/base/ folder created with:
  - [ ] BaseController.ts
  - [ ] BaseService.ts
  - [ ] BaseError.ts
  - [ ] BaseRoute.ts
- [ ] src/utils/ApiError.ts converted
- [ ] src/utils/ApiResponse.ts converted
- [ ] src/utils/asyncHandler.ts converted
- [ ] src/services/DatabaseService.ts created
- [ ] src/app.ts created (partial, needs router integration)
- [ ] src/index.ts created
- [ ] Project compiles: `npm run build` succeeds
- [ ] No TypeScript errors: `npm run typecheck` passes
- [ ] Notify Person 2, 3, 4 that they can start (base classes ready)

---

## Commands to Run
```bash
# Install dependencies
npm install

# Install TypeScript dev dependencies
npm install --save-dev typescript ts-node @types/node @types/express @types/mongoose @types/cors @types/cookie-parser @types/jsonwebtoken @types/multer @types/bcrypt

# Test TypeScript compilation
npm run build

# Test dev server (will fail without routes, but syntax should be correct)
npm run typecheck
```

---

## Notes
- Keep the same `.env` file structure
- Database URI format remains same
- All functionality preserved, only syntax/structure changes
- Focus on type safety and OOP principles
- Use proper TypeScript types instead of `any` where possible
