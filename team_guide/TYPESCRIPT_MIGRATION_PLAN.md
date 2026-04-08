# TypeScript Migration Plan - 5-Person Division

## Overview
Migrate entire Node.js/Express backend from JavaScript to TypeScript with class-based architecture (OOP).
All existing functionalities must remain the same. Code structure changes only.

---

## Person 1: Core Infrastructure & Config 👤
**Responsibility:** TypeScript Setup, App Configuration & Base Classes

### Setup Tasks:
1. **Install TypeScript Dependencies**
   - typescript, ts-node, @types/node, @types/express, @types/mongoose, etc.
   - Update package.json dev dependencies
   - Add build/dev scripts for TypeScript

2. **Create TypeScript Configuration**
   - tsconfig.json (ES2020, Node target, strict mode)
   - .env.example (already exists, no change needed)

3. **Create Base Classes** (new folder: src/base/)
   - `BaseController.ts` - Base class for all controllers with error handling
   - `BaseService.ts` - Base service class for database operations
   - `BaseRoute.ts` - Base route class for route registration
   - `BaseError.ts` - Enhanced ApiError class with TypeScript support

### Files to Convert:
- `src/app.ts` ← app.js (keep same logic, add types)
- `src/index.ts` ← index.js (keep same logic, add types)
- `src/db/index.ts` ← db/index.js (wrap in DatabaseService class)
- `src/utils/ApiError.ts` ← convert to class-based
- `src/utils/ApiResponse.ts` ← convert to class-based
- `src/utils/asyncHandler.ts` ← convert to class-based (middleware wrapper)

### Deliverables:
- [ ] package.json updated with TS dependencies
- [ ] tsconfig.json created
- [ ] src/base/ folder with 4 base classes
- [ ] src/app.ts (with types)
- [ ] src/index.ts (with types)
- [ ] Utils converted (ApiError, ApiResponse, asyncHandler)
- [ ] src/db/ as DatabaseService class

---

## Person 2: Models & Database Layer 👤
**Responsibility:** Mongoose Models with TypeScript & Class-Based Design

### Architecture:
- Create base `BaseModel.ts` class
- Each model class extends BaseModel
- Define TypeScript Interfaces for schemas
- All business logic in model methods (class methods)

### Files to Convert:
- `src/models/user.model.ts` ← user.model.js
  - UserSchema interface
  - User class with static methods (findByUsername, etc.)
  - Instance methods (generateAccessToken, generateRefreshToken, etc.)
  - Password hashing in pre-save hook

- `src/models/video.model.ts` ← video.model.js
  - VideoSchema interface
  - Video class with aggregation methods
  - All existing query methods

- `src/models/subscription.model.ts` ← subscription.model.js
  - SubscriptionSchema interface
  - Subscription class with related queries

### Dependencies:
- Wait for Person 1's base classes (BaseModel, asyncHandler)

### Deliverables:
- [ ] src/models/BaseModel.ts created
- [ ] src/models/user.model.ts (with interfaces & class)
- [ ] src/models/video.model.ts (with interfaces & class)
- [ ] src/models/subscription.model.ts (with interfaces & class)
- [ ] All Mongoose hooks & static methods converted

---

## Person 3: Middlewares & Utilities 👤
**Responsibility:** Middleware Classes & Utility Services

### Middleware Classes Structure:
Each middleware becomes a class with static methods or as middleware factory

### Files to Convert:
- `src/middlewares/auth.middleware.ts` ← auth.middleware.js
  - AuthMiddleware class with static methods (verifyJWT, verifyJWTAdmin)
  - Token validation logic
  - User association in request

- `src/middlewares/optionalAuth.middleware.ts` ← optionalAuth.middleware.js
  - OptionalAuthMiddleware class
  - Same as auth but optional (non-throwing)

- `src/middlewares/errors.middleware.ts` ← errors.middleware.js
  - ErrorHandler middleware class
  - Global error handling with proper status codes

- `src/middlewares/multer.middleware.ts` ← multer.middleware.js
  - FileUpload class
  - Configure storage for temp uploads
  - Keep file type validations

### Utility Services:
- `src/utils/CloudinaryService.ts` ← cloudinary.js
  - CloudinaryService class with static methods
  - Upload, delete, transform operations

- `src/utils/EmailService.ts` ← sendEmail.js
  - EmailService class
  - Error handling for email sending

### Dependencies:
- Wait for Person 1's base classes

### Deliverables:
- [ ] All middleware classes created
- [ ] CloudinaryService class
- [ ] EmailService class
- [ ] Proper TypeScript interfaces & types
- [ ] Error handling integrated

---

## Person 4: Controllers 👤
**Responsibility:** Controller Classes for Business Logic

### Controller Architecture:
- Each controller as a class extending BaseController
- Methods are instance methods or static methods
- Proper return types and error handling
- Dependencies injected through constructor

### Files to Convert:
- `src/controllers/user.controller.ts` ← user.controller.js
  - UserController class
  - Methods: registerUser, loginUser, logoutUser, refreshAccessToken, etc.
  - Use User model class methods
  - Dependency: User model, CloudinaryService, EmailService

- `src/controllers/video.controller.ts` ← video.controller.js
  - VideoController class
  - Methods: createVideo, getVideoById, updateVideo, etc.
  - Use Video model methods
  - Video aggregation pipelines

- `src/controllers/subscription.controller.ts` ← subscription.controller.js
  - SubscriptionController class
  - Methods: toggleSubscription, getChannelSubscribers, etc.
  - Use Subscription model

### Dependencies:
- Wait for Person 1 & 2 (BaseController, Models)
- Wait for Person 3 (Services)

### Deliverables:
- [ ] src/controllers/user.controller.ts (class-based)
- [ ] src/controllers/video.controller.ts (class-based)
- [ ] src/controllers/subscription.controller.ts (class-based)
- [ ] All route handlers functional
- [ ] Proper response types

---

## Person 5: Routes, Health & Final Integration 👤
**Responsibility:** Routes, Remaining Controllers & Build/Deploy Config

### Files to Convert:
- `src/controllers/health.controller.ts` ← health.controller.js
  - HealthController class
  - Simple health check endpoint

- `src/controllers/recommendation.controller.ts` ← recommendation.controller.js
  - RecommendationController class
  - Algorithm/logic remains same

- `src/routes/user.routes.ts` ← user.routes.js
  - Create RouteRegistry or use Express Router with classes
  - Register all user endpoints with middleware

- `src/routes/video.routes.ts` ← video.routes.js
  - Video route registration

- `src/routes/subscription.routes.ts` ← subscription.routes.js
  - Subscription route registration

- `src/routes/recommendations.routes.ts` ← recommendations.routes.js
  - Recommendations route registration

- `src/routes/health.routes.ts` ← health.routes.js
  - Health check route

- `src/utils/KeepAliveService.ts` ← keepAlive.js
  - KeepAliveService class
  - Cron job management in a class

### Configuration Files:
- Update package.json scripts:
  ```json
  "dev": "ts-node -r dotenv/config --experimental src/index.ts"
  "build": "tsc"
  "start": "node dist/index.js"
  ```
- Create tsconfig.json (from Person 1)
- Add build step for production

### Final Steps:
1. Integration testing
2. Verify all routes work
3. Update README.md with TypeScript info
4. Create migration summary document

### Dependencies:
- All other persons complete their work first

### Deliverables:
- [ ] All route files converted to TypeScript
- [ ] Health & Recommendation controllers
- [ ] KeepAliveService class
- [ ] package.json updated with build scripts
- [ ] Project compiles without errors
- [ ] All endpoints functional
- [ ] MIGRATION_COMPLETE.md document

---

## Timeline & Dependencies

```
Person 1 (Weeks 1-2): Setup → BASE CLASSES & CONFIG (BLOCKING)
    ↓
Person 2 (Weeks 2-3): MODELS (depends on Person 1)
    ↓
Person 3 (Weeks 2-3): MIDDLEWARES & UTILS (depends on Person 1)
    ↓
Person 4 (Weeks 3-4): CONTROLLERS (depends on Person 1, 2, 3)
    ↓
Person 5 (Weeks 4-5): ROUTES & FINAL INTEGRATION (depends on all)
```

---

## Class-Based Architecture Summary

### Key Principles:
1. **Controllers**: Extend BaseController, handle HTTP requests
2. **Services**: Business logic classes (User, Video, Subscription services)
3. **Models**: Mongoose schemas converted to classes with methods
4. **Middlewares**: Static or factory methods in classes
5. **Utilities**: Static utility classes (CloudinaryService, EmailService, etc.)

### Example Pattern:
```typescript
// Model
class User extends BaseModel {
  static async findByUsername(username: string): Promise<User | null> { }
  generateAccessToken(): string { }
}

// Service
class UserService {
  constructor(private userModel: typeof User) {}
  async registerUser(userData: UserDataDTO): Promise<User> { }
}

// Controller
class UserController extends BaseController {
  constructor(private userService: UserService) {}
  async registerUser(req: Request, res: Response, next: NextFunction): Promise<void> { }
}

// Route
const router = Router();
const userController = new UserController(new UserService(User));
router.post('/register', userController.registerUser.bind(userController));
```

---

## Common Type Definitions (Create in src/types/)

- `types/user.types.ts` - User interfaces
- `types/video.types.ts` - Video interfaces
- `types/subscription.types.ts` - Subscription interfaces
- `types/api.types.ts` - API response types
- `types/auth.types.ts` - Authentication types
- `types/index.ts` - Export all types

---

## Notes
- All environment variables remain same
- Database schema remains same (Mongoose)
- API endpoints remain same
- Error handling patterns stay consistent
- Cloudinary integration unchanged
- Email service integration unchanged
