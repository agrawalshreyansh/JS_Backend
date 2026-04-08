# Person 1: Core Infrastructure & Config - Detailed Guide

## Phase 1: Setup TypeScript Environment

### Step 1: Update package.json

Replace your scripts section with:
```json
"scripts": {
  "dev": "ts-node -r dotenv/config --esm src/index.ts",
  "build": "tsc",
  "start": "node dist/index.js",
  "typecheck": "tsc --noEmit"
}
```

> ⚠️ **Note:** Use `--esm` flag (not `--experimental`) because the project uses `"type": "module"` and Node16 module resolution.

Add TypeScript dependencies to devDependencies:
```json
"devDependencies": {
  "nodemon": "^3.1.9",
  "prettier": "^3.4.2",
  "typescript": "^5.3.3",
  "ts-node": "^10.9.2",
  "@types/node": "^20.10.6",
  "@types/express": "^4.17.21",
  "@types/cors": "^2.8.17",
  "@types/cookie-parser": "^1.4.7",
  "@types/jsonwebtoken": "^9.0.7",
  "@types/multer": "^1.4.11",
  "@types/bcrypt": "^5.0.2"
}
```

> ⚠️ **Note:** `@types/mongoose` has been removed — Mongoose v8 ships its own types natively. Installing it separately causes conflicts.

### Step 2: Create tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "Node16",
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
    "moduleResolution": "node16",
    "ignoreDeprecations": "5.0",
    "sourceMap": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "noImplicitThis": true,
    "alwaysStrict": true,
    "noUnusedLocals": false,
    "noImplicitReturns": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

> ⚠️ **Important deviations from original guide:**
> - `"module"` must be `"Node16"` (not `"ESNext"`) — TypeScript 5 requires module and moduleResolution to match.
> - `"moduleResolution"` must be `"node16"` (not `"node"`) — `"node"` is deprecated in TypeScript 5 and causes `TS5107`.
> - `"ignoreDeprecations": "5.0"` — silences any remaining TS5 deprecation warnings.
> - `"noUnusedLocals": false` — set to false during JS→TS migration to avoid false errors from JS files still in the project.
> - All relative imports must include `.js` extension (e.g., `'../utils/ApiError.js'`) when using Node16 module resolution.

### Step 3: Add export module in package.json

Keep `"type": "module"` in package.json

---

## Phase 2: Create Base Classes (src/base/)

### Step 1: Create BaseController.ts

```typescript
// src/base/BaseController.ts
// Pattern: Template Method — handleError & sendSuccess are reusable skeletons
// Pattern: Abstraction — hides HTTP response construction from controllers
// Principle: SRP — only responsible for response formatting

import { Response } from 'express';
import { ApiError } from '../utils/ApiError.js'; // .js required for Node16 module resolution

export abstract class BaseController {
  // Template Method: centralises error → HTTP response translation
  protected handleError(error: unknown, res: Response): void {
    // Narrow the type explicitly before accessing properties
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

  // Template Method: uniform success response across all controllers
  protected sendSuccess(
    res: Response,
    statusCode: number,
    data: unknown,           // 'unknown' instead of 'any' — safer typing
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
// Principle: DIP — depends on Model<T> abstraction, not a concrete model
// Principle: OCP — closed for modification, open for extension by subclasses
// Pattern: Template Method — subclasses extend without rewriting CRUD boilerplate
// Concept: Composition over Inheritance — has-a Model, doesn't inherit from it

import { Document, Model, FilterQuery, UpdateQuery } from 'mongoose';
// FilterQuery<T> and UpdateQuery<T> replace 'any' for proper type safety

export abstract class BaseService<T extends Document> {
  // Encapsulation: model is readonly and only accessible in this hierarchy
  constructor(protected readonly model: Model<T>) {}

  async create(data: Partial<T>): Promise<T> {
    return await this.model.create(data);
  }

  async findById(id: string): Promise<T | null> {
    return await this.model.findById(id);
  }

  // FilterQuery<T> replaces 'any' — gives proper Mongoose type checking
  async findOne(filter: FilterQuery<T>): Promise<T | null> {
    return await this.model.findOne(filter);
  }

  async find(filter: FilterQuery<T> = {}): Promise<T[]> {
    return await this.model.find(filter);
  }

  // UpdateQuery<T> replaces Partial<T> for updates — supports $set, $push etc.
  async updateById(id: string, data: UpdateQuery<T>): Promise<T | null> {
    return await this.model.findByIdAndUpdate(id, data, { new: true });
  }

  async deleteById(id: string): Promise<T | null> {
    return await this.model.findByIdAndDelete(id);
  }

  async findAndUpdate(
    filter: FilterQuery<T>,
    data: UpdateQuery<T>
  ): Promise<T | null> {
    return await this.model.findOneAndUpdate(filter, data, { new: true });
  }
}
```

> ⚠️ **Improvement over original guide:** `filter: any` and `data: Partial<T>` were replaced with `FilterQuery<T>` and `UpdateQuery<T>` from Mongoose — eliminating `any` and enabling proper type checking.

### Step 3: Create BaseError.ts (Enhanced ApiError)

```typescript
// src/base/BaseError.ts
// Principle: SRP — only models a structured application error
// Principle: Encapsulation — all fields are readonly
// Principle: LSP — extends Error correctly with prototype chain fix

export class BaseError extends Error {
  public readonly statusCode: number;
  public readonly success: boolean;
  public readonly errors: unknown[];  // 'unknown[]' instead of 'any[]'
  public readonly data: unknown;      // 'unknown' instead of 'any'

  constructor(
    statusCode: number,
    message: string = 'Something went wrong',
    errors: unknown[] = [],
    data: unknown = null,
    stack?: string
  ) {
    super(message);
    this.statusCode = statusCode;
    this.message = message;
    this.success = false;
    this.errors = errors;
    this.data = data;

    // LSP fix: ensure instanceof BaseError works after TypeScript transpilation
    Object.setPrototypeOf(this, BaseError.prototype);

    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}
```

### Step 4: Create BaseRoute.ts

```typescript
// src/base/BaseRoute.ts
// Pattern: Template Method — setupRoutes() is an abstract hook called on construction
// Principle: OCP — BaseRoute never changes; extend it for each new route file
// Principle: SRP — only responsible for router creation and routing contract

import { Router } from 'express';

export abstract class BaseRoute {
  // router is public so app.ts can mount it; readonly prevents reassignment
  public readonly router: Router;

  constructor() {
    this.router = Router();
    // Template Method: hook called automatically at construction time
    this.setupRoutes();
  }

  // Every subclass MUST implement this — defines all its GET/POST/PUT/DELETE routes
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
// Principle: SRP — only models an API error
// Principle: Encapsulation — all fields are readonly
// Principle: LSP — prototype chain fix for correct instanceof checks

export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly data: null;
  public readonly success: boolean;
  public readonly errors: unknown[];  // 'unknown[]' instead of 'any[]'

  constructor(
    statusCode: number,
    message: string = 'Something went wrong',
    errors: unknown[] = [],
    stack: string = ''
  ) {
    super(message);
    this.statusCode = statusCode;
    this.data = null;
    this.message = message;
    this.success = false;
    this.errors = errors;

    // LSP fix: ensures instanceof ApiError works after transpilation
    Object.setPrototypeOf(this, ApiError.prototype);

    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}
```

### Step 2: Convert ApiResponse.ts

```typescript
// src/utils/ApiResponse.ts
// Principle: SRP — only models a successful API response
// Principle: ISP — separate ApiResponseData interface for callers that only need the shape
// Principle: Encapsulation — success is derived from statusCode, not set manually

// ISP: consumers that only need to READ the response shape depend on this
// interface, not the full class (useful for tests, type-checking, etc.)
export interface ApiResponseData {
  statusCode: number;
  data: unknown;    // 'unknown' instead of 'any'
  message: string;
  success: boolean;
}

// ApiResponse implements the interface — enforces consistent shape
export class ApiResponse implements ApiResponseData {
  public readonly statusCode: number;
  public readonly data: unknown;
  public readonly message: string;
  public readonly success: boolean;

  constructor(statusCode: number, data: unknown, message: string = 'Success') {
    this.statusCode = statusCode;
    this.data = data;
    this.message = message;
    // Encapsulation: success computed automatically — callers don't set it
    this.success = statusCode < 400;
  }
}
```

> ⚠️ **Improvement over original guide:** `ApiResponse` now `implements ApiResponseData` (ISP) and all `any` types replaced with `unknown` for safer type checking.

### Step 3: Convert asyncHandler.ts

```typescript
// src/utils/asyncHandler.ts
// Pattern: Strategy — wraps any async handler as an interchangeable strategy
// Pattern: Adapter — converts async function to Express synchronous middleware signature
// Principle: SRP — only responsible for async error forwarding

import { Request, Response, NextFunction } from 'express';

// Named type for clarity — replaces inline 'any' in the original
type AsyncRequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<unknown>;

export const asyncHandler = (requestHandler: AsyncRequestHandler) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(requestHandler(req, res, next)).catch(
      (error: Error) => next(error)
    );
  };
};
```

### Step 4: Create KeepAliveService.ts (NEW — replaces keepAlive.js)

> ℹ️ **This file was not in the original guide** but is required because `index.ts` imports it. The original project had a plain function in `keepAlive.js` — we replace it with a proper class.

```typescript
// src/utils/KeepAliveService.ts
// Pattern: Singleton — only one instance and one cron job ever runs
// Principle: SRP — only responsible for pinging the health endpoint
// Principle: Encapsulation — internals (job, serverUrl, ping logic) are private

import cron, { ScheduledTask } from 'node-cron';

export class KeepAliveService {
  // Singleton: static instance field
  private static instance: KeepAliveService | null = null;

  private job: ScheduledTask | null = null;
  private readonly serverUrl: string;

  // Singleton: private constructor prevents external 'new KeepAliveService()'
  private constructor(serverUrl: string) {
    this.serverUrl = serverUrl;
  }

  // Singleton access point — creates on first call, returns cached after that
  static getInstance(serverUrl: string): KeepAliveService {
    if (!KeepAliveService.instance) {
      KeepAliveService.instance = new KeepAliveService(serverUrl);
    }
    return KeepAliveService.instance;
  }

  // Abstraction: callers just call start() — they don't know about cron syntax
  start(): void {
    if (this.job) {
      console.log('KeepAliveService is already running.');
      return;
    }

    this.job = cron.schedule('*/10 * * * *', async () => {
      await this.ping();
    });

    console.log('🕐 Keep-alive cron job started — Server will be pinged every 10 minutes');
  }

  // Graceful shutdown
  stop(): void {
    if (this.job) {
      this.job.stop();
      this.job = null;
      console.log('🛑 Keep-alive cron job stopped');
    }
  }

  // Encapsulation: actual HTTP ping is hidden from the outside world
  private async ping(): Promise<void> {
    const timestamp = new Date().toISOString();
    try {
      console.log(`[${timestamp}] Keep-alive ping initiated...`);

      const response = await fetch(`${this.serverUrl}/api/v1/health`);
      const data = (await response.json()) as { data?: { status?: string } };

      if (response.ok) {
        console.log(`[${timestamp}] ✓ Server is awake — Status: ${data?.data?.status}`);
      } else {
        console.log(`[${timestamp}] ✗ Server responded with status: ${response.status}`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`[${timestamp}] ✗ Keep-alive ping failed: ${message}`);
    }
  }
}
```

---

## Phase 4: Convert Database Connection

### Step 1: Create DatabaseService.ts

```typescript
// src/services/DatabaseService.ts
// Pattern: Singleton — only one MongoDB connection exists per application
// Principle: SRP — only manages Mongoose connection lifecycle
// Principle: Encapsulation — connection details are private
// Principle: Abstraction — callers just call connect(); ORM details are hidden

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
      const mongoUri = process.env.MONGODB_URL || '';
      // DB_NAME read from env; falls back to 'videotube' (matches original db/index.js)
      const dbName = process.env.DB_NAME || 'videotube';

      if (!mongoUri) {
        throw new Error('MONGODB_URL is not defined in environment variables');
      }

      const connectionInstance = await mongoose.connect(`${mongoUri}/${dbName}`);
      console.log(`✓ Database connected — Host: ${connectionInstance.connection.host}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`✗ Database connection failed: ${message}`);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    try {
      await mongoose.disconnect();
      console.log('✓ Database disconnected successfully');
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`✗ Database disconnection failed: ${message}`);
      throw error;
    }
  }

  getConnection(): mongoose.Connection {
    return mongoose.connection;
  }
}
```

> ⚠️ **Improvement over original guide:** `connect()` reads `MONGODB_URL` (matches the env key used by the original `db/index.js`) and appends `DB_NAME` from env — exactly mirroring the old behaviour. The guide's version used `MONGODB_URI` and called `mongoose.connect(mongoUri)` directly without the DB name.

---

## Phase 5: Convert App and Server Files

### Step 1: Convert errors.middleware.ts (NEW — not in original guide)

> ℹ️ **This file was not mentioned in the original guide** but must be converted because `app.ts` imports it. Without the `.ts` version, TypeScript compilation fails.

```typescript
// src/middlewares/errors.middleware.ts
// Principle: SRP — only converts errors into HTTP responses
// Pattern: Observer — Express automatically routes next(error) calls here
// Pattern: Strategy — picks response strategy based on error type

import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/ApiError.js';

const errorHandler = (
  err: Error | ApiError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const statusCode = err instanceof ApiError ? err.statusCode : 500;
  const message = err.message || 'Internal Server Error';
  const errors = err instanceof ApiError ? err.errors : [];

  // Security improvement: only expose stack trace in development mode
  const stack = process.env.NODE_ENV === 'development' ? err.stack : undefined;

  res.status(statusCode).json({
    success: false,
    message,
    errors,
    stack,
  });
};

export default errorHandler;
```

### Step 2: Convert constants.ts (NEW — not in original guide)

> ℹ️ **This file was not mentioned in the original guide** but is needed to replace `constants.js` which was imported by the old `db/index.js`.

```typescript
// src/constants.ts
// 'as const' makes DB_NAME a literal type 'videotube', not just string
export const DB_NAME = 'videotube' as const;
```

### Step 3: Convert app.ts

```typescript
// src/app.ts
// Pattern: Factory Method — AppFactory.getApp() returns the built Express app
// Principle: OCP — add routes/middleware without modifying existing methods
// Concept: Composition over Inheritance — has-an Express app, doesn't extend it
// Principle: SRP — each private method handles exactly one setup concern

import express, { Application } from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import errorHandler from './middlewares/errors.middleware.js';

// ISP: only contains what AppFactory needs
interface AppConfig {
  corsOrigin: string;
}

export class AppFactory {
  private readonly app: Application;

  constructor(private readonly config: AppConfig) {
    this.app = express();
    this.setupMiddlewares();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  private setupMiddlewares(): void {
    this.app.use(cors({ origin: this.config.corsOrigin, credentials: true }));
    this.app.use(express.json({ limit: '16mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '20kb' }));
    this.app.use(express.static('public'));
    this.app.use(cookieParser());
  }

  private setupRoutes(): void {
    // During JS→TS migration, JS route files are loaded via require()
    // These will be replaced with TS imports by Persons 4 & 5
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const userRouter = require('./routes/user.routes.js').default;
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const videoRouter = require('./routes/video.routes.js').default;
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const subscriptionRouter = require('./routes/subscription.routes.js').default;
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const recommendationRouter = require('./routes/recommendations.routes.js').default;
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const healthRouter = require('./routes/health.routes.js').default;

    this.app.use('/api/v1/users', userRouter);
    this.app.use('/api/v1/videos', videoRouter);
    this.app.use('/api/v1/subscriptions', subscriptionRouter);
    this.app.use('/api/v1/recommend', recommendationRouter);
    this.app.use('/api/v1/health', healthRouter);
  }

  private setupErrorHandling(): void {
    this.app.use(errorHandler);
  }

  getApp(): Application {
    return this.app;
  }
}
```

### Step 4: Convert index.ts

```typescript
// src/index.ts
// Principle: DIP — uses DatabaseService & AppFactory abstractions, not mongoose/express directly
// Pattern: Singleton — DatabaseService.getInstance() & KeepAliveService.getInstance()
// Principle: SRP — startServer() only orchestrates startup; each class does its own job

import dotenv from 'dotenv';
import { DatabaseService } from './services/DatabaseService.js';
import { AppFactory } from './app.js';
import { KeepAliveService } from './utils/KeepAliveService.js';

dotenv.config({ path: '.env' });

// Typed constants from env
const PORT: number = parseInt(process.env.PORT || '8000', 10);
const CORS_ORIGIN: string = process.env.CORS_ORIGIN || '*';
const SERVER_URL: string = process.env.SERVER_URL || `http://localhost:${PORT}`;

async function startServer(): Promise<void> {
  try {
    // Step 1: Connect to DB (Singleton — one connection ever)
    const dbService = DatabaseService.getInstance();
    await dbService.connect();

    // Step 2: Build Express app (Factory Method)
    const appFactory = new AppFactory({ corsOrigin: CORS_ORIGIN });
    const app = appFactory.getApp();

    // Step 3: Start listening
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`✓ Server is running on http://localhost:${PORT}`);

      // Step 4: Start keep-alive pings (Singleton)
      const keepAlive = KeepAliveService.getInstance(SERVER_URL);
      keepAlive.start();
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`✗ Failed to start server: ${message}`);
    process.exit(1);
  }
}

startServer();
```

> ⚠️ **Difference from original guide:** `index.ts` uses `KeepAliveService.getInstance(SERVER_URL)` (Singleton) instead of `new KeepAliveService(SERVER_URL)`. All imports include `.js` extension for Node16 module resolution. `PORT` is typed as `number` and parsed with `parseInt`.

---

## Checklist for Person 1 Completion

- [x] package.json updated with all TS dependencies
- [x] tsconfig.json created in root (using `Node16` module resolution)
- [x] src/base/ folder created with:
  - [x] BaseController.ts
  - [x] BaseService.ts
  - [x] BaseError.ts
  - [x] BaseRoute.ts
- [x] src/utils/ApiError.ts converted
- [x] src/utils/ApiResponse.ts converted (with `ApiResponseData` interface)
- [x] src/utils/asyncHandler.ts converted
- [x] src/utils/KeepAliveService.ts created (Singleton class — replaces keepAlive.js)
- [x] src/services/DatabaseService.ts created
- [x] src/middlewares/errors.middleware.ts converted
- [x] src/constants.ts created
- [x] src/app.ts created (with real route mounting)
- [x] src/index.ts created
- [x] Project compiles: `npm run build` succeeds
- [x] No TypeScript errors: `npm run typecheck` passes
- [x] Notify Person 2, 3, 4 that they can start (base classes ready)

---

## Commands to Run

```bash
# Install dependencies
npm install

# Install TypeScript dev dependencies
npm install --save-dev typescript ts-node @types/node @types/express @types/cors @types/cookie-parser @types/jsonwebtoken @types/multer @types/bcrypt

# Test TypeScript compilation
npm run build

# Check for type errors (no output = success)
npm run typecheck
```

---

## Notes

- Keep the same `.env` file structure
- Database URI env key is `MONGODB_URL` (not `MONGODB_URI`)
- All relative TypeScript imports **must** use `.js` extension when `moduleResolution` is `node16`
- All functionality is preserved, only syntax/structure changes
- `any` types replaced with `unknown`, `FilterQuery<T>`, `UpdateQuery<T>` throughout
- JS files belonging to Persons 2–5 are left untouched until they do their migration
- Stack traces are hidden in production (only shown when `NODE_ENV=development`)
