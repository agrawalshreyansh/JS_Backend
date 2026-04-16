# Class Diagram — JS_Backend (VideoTube)

A detailed UML class diagram covering all classes, interfaces, abstract base types, attributes, methods (with visibility, types, parameters, return types), relationships (inheritance, realization, composition, aggregation, dependency, association), multiplicities, and the design patterns applied.

> Notation
> - `+` public &nbsp;&nbsp; `-` private &nbsp;&nbsp; `#` protected &nbsp;&nbsp; `~` package / internal
> - `<<abstract>>`, `<<interface>>`, `<<singleton>>`, `<<factory>>`, `<<DTO>>`, `<<enum>>`
> - `--|>` inheritance &nbsp;&nbsp; `..|>` realization (implements)
> - `*--` composition &nbsp;&nbsp; `o--` aggregation &nbsp;&nbsp; `-->` association / dependency
> - `1`, `*`, `0..1` multiplicity on association ends

---

## 1. High-Level Package Structure

```
src/
├── base/          → Abstract base classes (BaseController, BaseService, BaseRoute, BaseError)
├── models/        → Mongoose schemas & domain entities (User, Video, Subscription, BaseModel)
├── types/         → Interfaces & DTOs (IUser, IVideo, ISubscription, UserDTO, LoginDTO, VideoDTO, SubscriptionDTO)
├── services/      → Business/persistence services (DatabaseService, UserModelService)
├── controllers/   → HTTP controllers (user, video, subscription, recommendation, health)
├── routes/        → Express routers (user, video, subscription, recommendations, health)
├── middlewares/   → Cross-cutting middleware (auth, errors, multer, optionalAuth)
├── utils/         → Helpers (ApiError, ApiResponse, asyncHandler, KeepAliveService, cloudinary, sendEmail)
├── app.ts         → AppFactory (composition root for Express)
└── index.ts       → startServer() bootstrap
```

---

## 2. Mermaid Class Diagram (Full)

```mermaid
classDiagram
    direction LR

    %% =====================================================
    %% INTERFACES (types/)
    %% =====================================================
    class IUser {
        <<interface>>
        +username: string
        +email: string
        +fullName: string
        +avatar: string
        +coverImage?: string
        +password: string
        +refreshToken?: string
        +watchHistory: ObjectId[]
        +createdAt: Date
        +updatedAt: Date
        +generateAccessToken() string
        +generateRefreshToken() string
        +isPasswordCorrect(password: string) Promise~boolean~
    }

    class IVideo {
        <<interface>>
        +videoFile: string
        +thumbnail: string
        +title: string
        +description: string
        +duration: number
        +views: number
        +isPublished: boolean
        +owner: ObjectId
        +createdAt: Date
        +updatedAt: Date
        +incrementViews() Promise~void~
    }

    class ISubscription {
        <<interface>>
        +subscriber: ObjectId
        +channel: ObjectId
        +createdAt: Date
        +updatedAt: Date
    }

    class UserDTO {
        <<DTO>>
        +username: string
        +email: string
        +fullName: string
        +password: string
        +avatar: string
        +coverImage?: string
    }

    class LoginDTO {
        <<DTO>>
        +username?: string
        +email?: string
        +password: string
    }

    class VideoDTO {
        <<DTO>>
        +videoFile: string
        +thumbnail: string
        +title: string
        +description: string
        +duration: number
        +owner: string
    }

    class SubscriptionDTO {
        <<DTO>>
        +subscriber: string
        +channel: string
    }

    class ApiResponseData {
        <<interface>>
        +statusCode: number
        +data: unknown
        +message: string
        +success: boolean
    }

    class AppConfig {
        <<interface>>
        +corsOrigin: string
    }

    class IUserModel {
        <<interface>>
        +findByUsername(username: string) Promise~IUser~
        +findByEmail(email: string) Promise~IUser~
    }

    class IVideoModel {
        <<interface>>
        +findPublished() Promise~IVideo[]~
        +findByOwner(ownerId: string) Promise~IVideo[]~
    }

    class ISubscriptionModel {
        <<interface>>
        +findBySubscriberAndChannel(subId: string, chId: string) Promise~ISubscription~
        +findChannelSubscribers(channelId: string) Promise~ISubscription[]~
        +findSubscriberChannels(subId: string) Promise~ISubscription[]~
        +getSubscriberCount(channelId: string) Promise~number~
    }

    %% =====================================================
    %% ABSTRACT BASE CLASSES (base/)
    %% =====================================================
    class BaseController {
        <<abstract>>
        #handleError(error: unknown, res: Response) void
        #sendSuccess(res: Response, statusCode: number, data: unknown, message: string) void
    }

    class BaseService~T~ {
        <<abstract>>
        #model: Model~T~
        +BaseService(model: Model~T~)
        +create(data: Partial~T~) Promise~T~
        +findById(id: string) Promise~T~
        +findOne(filter: AnyFilter) Promise~T~
        +find(filter: AnyFilter) Promise~T[]~
        +updateById(id: string, data: AnyFilter) Promise~T~
        +deleteById(id: string) Promise~T~
        +findAndUpdate(filter: AnyFilter, data: AnyFilter) Promise~T~
    }

    class BaseRoute {
        <<abstract>>
        +router: Router
        +BaseRoute()
        +setupRoutes()* void
        #getRouter() Router
    }

    class BaseError {
        +statusCode: number
        +success: boolean
        +errors: unknown[]
        +data: unknown
        +BaseError(statusCode, message, errors, data, stack)
    }

    class BaseModel~T~ {
        <<abstract>>
        #model: Model~T~
        +BaseModel(model: Model~T~)
        +create(data: Partial~T~) Promise~T~
        +findById(id: string) Promise~T~
        +findOne(filter: any) Promise~T~
        +find(filter?: any) Promise~T[]~
        +updateById(id: string, data: Partial~T~) Promise~T~
        +deleteById(id: string) Promise~T~
        +countDocuments(filter?: any) Promise~number~
        +exists(filter: any) Promise~boolean~
    }

    %% =====================================================
    %% UTILITIES (utils/)
    %% =====================================================
    class ApiError {
        +statusCode: number
        +data: null
        +success: boolean
        +errors: unknown[]
        +ApiError(statusCode, message, errors, stack)
    }

    class ApiResponse {
        +statusCode: number
        +data: unknown
        +message: string
        +success: boolean
        +ApiResponse(statusCode, data, message)
    }

    class AsyncHandler {
        <<utility / HOF>>
        +asyncHandler(fn: AsyncRequestHandler) RequestHandler
    }

    class KeepAliveService {
        <<singleton>>
        -static instance: KeepAliveService
        -job: ScheduledTask
        -serverUrl: string
        -KeepAliveService(serverUrl: string)
        +static getInstance(serverUrl: string) KeepAliveService
        +start() void
        +stop() void
        -ping() Promise~void~
    }

    class Cloudinary {
        <<utility>>
        +uploadOnCloud(path: string) Promise~any~
    }

    class SendEmail {
        <<utility>>
        +sendEmail(options) Promise~void~
    }

    %% =====================================================
    %% SERVICES
    %% =====================================================
    class DatabaseService {
        <<singleton>>
        -static instance: DatabaseService
        -DatabaseService()
        +static getInstance() DatabaseService
        +connect() Promise~void~
        +disconnect() Promise~void~
        +getConnection() mongoose.Connection
    }

    class UserModelService {
        <<facade>>
        +registerUser(data: UserDTO) Promise~IUser~
        +findUserByUsername(username: string) Promise~IUser~
        +findUserByEmail(email: string) Promise~IUser~
        +findUserById(userId: string) Promise~IUser~
        +updateRefreshToken(userId: string, token: string) Promise~void~
        +clearRefreshToken(userId: string) Promise~void~
    }

    %% =====================================================
    %% DOMAIN MODELS (Mongoose)
    %% =====================================================
    class User {
        <<model>>
        +username: string
        +email: string
        +fullName: string
        +avatar: string
        +coverImage?: string
        +password: string
        +refreshToken?: string
        +watchHistory: ObjectId[]
        -pre_save_hash_password()
        +isPasswordCorrect(pwd: string) Promise~boolean~
        +generateAccessToken() string
        +generateRefreshToken() string
        +static findByUsername(username: string) Promise~IUser~
        +static findByEmail(email: string) Promise~IUser~
    }

    class Video {
        <<model>>
        +videoFile: string
        +thumbnail: string
        +title: string
        +description: string
        +duration: number
        +views: number
        +isPublished: boolean
        +owner: ObjectId
        +incrementViews() Promise~void~
        +static findPublished() Promise~IVideo[]~
        +static findByOwner(ownerId: string) Promise~IVideo[]~
    }

    class Subscription {
        <<model>>
        +subscriber: ObjectId
        +channel: ObjectId
        +static findBySubscriberAndChannel(s, c) Promise~ISubscription~
        +static findChannelSubscribers(channelId: string) Promise~ISubscription[]~
        +static findSubscriberChannels(subId: string) Promise~ISubscription[]~
        +static getSubscriberCount(channelId: string) Promise~number~
    }

    %% =====================================================
    %% CONTROLLERS (function modules)
    %% =====================================================
    class UserController {
        <<module>>
        +registerUser(req, res)
        +loginUser(req, res)
        +logoutUser(req, res)
        +refreshAccessToken(req, res)
        +changeCurrentPassword(req, res)
        +getCurrentUser(req, res)
        +updateAccountDetails(req, res)
        +updateUserAvatar(req, res)
        +updateUserCover(req, res)
        +getUserChannelProfile(req, res)
        +authenticateUser(req, res)
        +forgotPassword(req, res)
        +deleteHistory(req, res)
        -generateAccessAndRefreshTokens(userId) {accessToken, refreshToken}
    }

    class VideoController {
        <<module>>
        +publishVideo(req, res)
        +getVideoById(req, res)
        +updateVideo(req, res)
        +deleteVideo(req, res)
        +togglePublishStatus(req, res)
        +getAllVideos(req, res)
    }

    class SubscriptionController {
        <<module>>
        +toggleSubscription(req, res)
        +getUserChannelSubscribers(req, res)
        +getSubscribedChannels(req, res)
    }

    class RecommendationController {
        <<module>>
        +getRecommendations(req, res)
    }

    class HealthController {
        <<module>>
        +healthcheck(req, res)
    }

    %% =====================================================
    %% ROUTES
    %% =====================================================
    class UserRouter {
        <<router>>
        +router: Router
    }
    class VideoRouter {
        <<router>>
        +router: Router
    }
    class SubscriptionRouter {
        <<router>>
        +router: Router
    }
    class RecommendationRouter {
        <<router>>
        +router: Router
    }
    class HealthRouter {
        <<router>>
        +router: Router
    }

    %% =====================================================
    %% MIDDLEWARES
    %% =====================================================
    class AuthMiddleware {
        <<middleware>>
        +verifyJWT(req, _, next)
    }
    class OptionalAuthMiddleware {
        <<middleware>>
        +optionalAuth(req, _, next)
    }
    class MulterMiddleware {
        <<middleware>>
        +upload: multer.Multer
    }
    class ErrorsMiddleware {
        <<middleware>>
        +errorHandler(err, req, res, next) void
    }

    %% =====================================================
    %% APP / BOOTSTRAP
    %% =====================================================
    class AppFactory {
        <<factory>>
        -app: Application
        -config: AppConfig
        +AppFactory(config: AppConfig)
        -setupMiddlewares() void
        -setupRoutes() void
        -setupErrorHandling() void
        +getApp() Application
    }

    class Index {
        <<bootstrap>>
        +startServer() Promise~void~
    }

    %% =====================================================
    %% INHERITANCE / REALIZATION
    %% =====================================================
    BaseError --|> Error
    ApiError --|> Error
    ApiResponse ..|> ApiResponseData

    User ..|> IUser
    Video ..|> IVideo
    Subscription ..|> ISubscription

    IUserModel --|> Model
    IVideoModel --|> Model
    ISubscriptionModel --|> Model

    %% Base classes are extension points (concrete subclasses
    %% exist in dist/ and are intended future refactor targets)
    BaseController <|.. UserController : (intended)
    BaseController <|.. VideoController : (intended)
    BaseService <|-- UserModelService : (intended)
    BaseRoute <|.. UserRouter : (intended)
    BaseModel <|-- User : (conceptual)
    BaseModel <|-- Video : (conceptual)
    BaseModel <|-- Subscription : (conceptual)

    %% =====================================================
    %% COMPOSITION / AGGREGATION
    %% =====================================================
    AppFactory *-- "1" Application : composes
    AppFactory o-- AppConfig : uses
    AppFactory --> ErrorsMiddleware : registers
    AppFactory --> UserRouter : mounts
    AppFactory --> VideoRouter : mounts
    AppFactory --> SubscriptionRouter : mounts
    AppFactory --> RecommendationRouter : mounts
    AppFactory --> HealthRouter : mounts

    Index --> DatabaseService : uses singleton
    Index --> AppFactory : instantiates
    Index --> KeepAliveService : uses singleton

    KeepAliveService *-- "0..1" ScheduledTask : owns
    DatabaseService ..> mongoose : delegates

    BaseService *-- "1" Model : depends
    BaseModel *-- "1" Model : depends
    UserModelService ..> User : uses
    UserModelService ..> ApiError : throws

    %% =====================================================
    %% DOMAIN ASSOCIATIONS
    %% =====================================================
    User "1" --> "*" Video : owns (owner FK)
    User "1" --> "*" Subscription : as subscriber
    User "1" --> "*" Subscription : as channel
    User "1" o-- "*" Video : watchHistory
    Subscription "*" --> "1" User : subscriber
    Subscription "*" --> "1" User : channel
    Video "*" --> "1" User : owner

    %% =====================================================
    %% CONTROLLER / MODEL / ROUTE WIRING
    %% =====================================================
    UserRouter --> UserController : dispatches
    VideoRouter --> VideoController : dispatches
    SubscriptionRouter --> SubscriptionController : dispatches
    RecommendationRouter --> RecommendationController : dispatches
    HealthRouter --> HealthController : dispatches

    UserController ..> User : reads/writes
    UserController ..> ApiError : throws
    UserController ..> ApiResponse : returns
    UserController ..> AsyncHandler : wraps
    UserController ..> Cloudinary : uploads
    UserController ..> AuthMiddleware : protected by

    VideoController ..> Video : reads/writes
    VideoController ..> ApiError : throws
    VideoController ..> ApiResponse : returns
    VideoController ..> Cloudinary : uploads

    SubscriptionController ..> Subscription : reads/writes
    SubscriptionController ..> User : references

    AuthMiddleware ..> User : looks up
    AuthMiddleware ..> ApiError : throws
    AuthMiddleware ..> AsyncHandler : wrapped by

    ErrorsMiddleware ..> ApiError : matches
    BaseController ..> ApiError : inspects

    MulterMiddleware ..> multer : uses
```

---

## 3. Detailed Class Specifications

### 3.1 Abstract Base Classes (`src/base/`)

#### `BaseController` *(abstract)*
| Member | Visibility | Type / Signature | Purpose |
|---|---|---|---|
| `handleError` | protected | `(error: unknown, res: Response): void` | Translates `ApiError` / generic `Error` into HTTP JSON response. |
| `sendSuccess` | protected | `(res: Response, statusCode: number, data: unknown, message?: string): void` | Uniform success envelope `{statusCode,data,message,success:true}`. |

**Patterns:** Template Method, Abstraction, SRP.

#### `BaseService<T extends Document>` *(abstract, generic)*
| Member | Visibility | Signature | Notes |
|---|---|---|---|
| `model` | protected readonly | `Model<T>` | Injected via constructor (DIP). |
| `create` | public | `(data: Partial<T>) => Promise<T>` | |
| `findById` | public | `(id: string) => Promise<T\|null>` | |
| `findOne` | public | `(filter: AnyFilter) => Promise<T\|null>` | |
| `find` | public | `(filter?: AnyFilter) => Promise<T[]>` | |
| `updateById` | public | `(id: string, data: AnyFilter) => Promise<T\|null>` | |
| `deleteById` | public | `(id: string) => Promise<T\|null>` | |
| `findAndUpdate` | public | `(filter, data) => Promise<T\|null>` | |

**Patterns:** DIP, Template Method, OCP, Composition over Inheritance.

#### `BaseRoute` *(abstract)*
| Member | Visibility | Signature |
|---|---|---|
| `router` | public readonly | `Router` |
| `constructor()` | public | calls `setupRoutes()` (template) |
| `setupRoutes()` | public abstract | `void` |
| `getRouter()` | protected | `Router` |

**Patterns:** Template Method, OCP, SRP.

#### `BaseError` *(extends Error)*
| Member | Visibility | Type |
|---|---|---|
| `statusCode` | public readonly | `number` |
| `success` | public readonly | `boolean` (always false) |
| `errors` | public readonly | `unknown[]` |
| `data` | public readonly | `unknown` |

**Patterns:** SRP, Encapsulation, LSP (fixed prototype chain).

---

### 3.2 Models (`src/models/`)

#### `BaseModel<T extends Document>` *(abstract, generic)*
Adds `countDocuments` and `exists` on top of generic CRUD. Validates ObjectId in `findById`.

#### `User` *(Mongoose Model, `IUser` + `IUserModel`)*
**Schema Fields:** `username`, `email`, `fullName`, `avatar`, `coverImage?`, `watchHistory: ObjectId[]→Video`, `password`, `refreshToken?`, `createdAt`, `updatedAt`.
**Indexes:** `username` unique+indexed, `fullName` indexed, `email` unique.
**Hooks:** `pre('save')` hashes password via bcrypt (Observer).
**Instance Methods:** `isPasswordCorrect`, `generateAccessToken`, `generateRefreshToken`.
**Static Methods:** `findByUsername`, `findByEmail`.
**Plugins:** `mongoose-aggregate-paginate-v2` (Adapter).

#### `Video` *(Mongoose Model, `IVideo` + `IVideoModel`)*
**Fields:** `videoFile`, `thumbnail`, `title`, `description`, `duration`, `views=0`, `isPublished=true`, `owner: ObjectId→User`.
**Instance:** `incrementViews()`.
**Statics:** `findPublished()`, `findByOwner(id)`.
**Plugins:** aggregate-paginate.

#### `Subscription` *(Mongoose Model, `ISubscription` + `ISubscriptionModel`)*
**Fields:** `subscriber: ObjectId→User`, `channel: ObjectId→User`.
**Indexes:** compound unique `{ subscriber:1, channel:1 }`.
**Statics:** `findBySubscriberAndChannel`, `findChannelSubscribers`, `findSubscriberChannels`, `getSubscriberCount`.

---

### 3.3 Services (`src/services/`)

#### `DatabaseService` *(Singleton)*
| Member | Visibility | Signature |
|---|---|---|
| `instance` | private static | `DatabaseService` |
| `constructor()` | private | — |
| `getInstance()` | public static | `DatabaseService` |
| `connect()` | public | `Promise<void>` |
| `disconnect()` | public | `Promise<void>` |
| `getConnection()` | public | `mongoose.Connection` |

#### `UserModelService` *(Facade over `User` model)*
| Method | Signature |
|---|---|
| `registerUser` | `(UserDTO) => Promise<IUser>` — factory + uniqueness check; throws `ApiError(409)` |
| `findUserByUsername` | `(string) => Promise<IUser\|null>` |
| `findUserByEmail` | `(string) => Promise<IUser\|null>` |
| `findUserById` | `(string) => Promise<IUser\|null>` |
| `updateRefreshToken` | `(userId, token) => Promise<void>` |
| `clearRefreshToken` | `(userId) => Promise<void>` |

**Patterns:** Facade, SRP, DIP, Factory Method (conceptual).

---

### 3.4 Utilities (`src/utils/`)

#### `ApiError` *(extends Error)*
`+statusCode:number`, `+data:null`, `+success:false`, `+errors:unknown[]`, `+message:string`, `+stack?:string`.

#### `ApiResponse` *(implements `ApiResponseData`)*
`+statusCode:number`, `+data:unknown`, `+message:string`, `+success:boolean` (derived: `statusCode<400`).

#### `asyncHandler` *(HOF)*
`(fn: AsyncRequestHandler) => (req, res, next) => void` — wraps async controller; forwards rejections to Express `next`.
**Patterns:** Strategy + Adapter.

#### `KeepAliveService` *(Singleton)*
Schedules `cron('*/10 * * * *')` ping to `${serverUrl}/api/v1/health`. Private fields `instance`, `job`, `serverUrl`.

#### `Cloudinary` *(utility function module)*
`uploadOnCloud(localPath)` — uploads file and returns Cloudinary URL.

#### `SendEmail` *(utility function module)*
`sendEmail(options)` — wraps nodemailer / transport.

---

### 3.5 Middlewares (`src/middlewares/`)

| Class / Module | Key Export | Responsibility |
|---|---|---|
| `AuthMiddleware` | `verifyJWT(req,_,next)` | Verifies `accessToken` cookie/header, loads `req.user`, throws `ApiError(401/403)`. |
| `OptionalAuthMiddleware` | `optionalAuth` | Same as verifyJWT but continues if no token. |
| `MulterMiddleware` | `upload` | Multipart file upload (avatar/coverImage/videoFile). |
| `ErrorsMiddleware` | `errorHandler(err,req,res,next)` | Global error handler — Strategy switch on `err instanceof ApiError`. |

---

### 3.6 Controllers (`src/controllers/`)

Each controller is a function-module (not yet a class). Planned refactor extends `BaseController`.

#### `UserController` (13 exports)
`registerUser`, `loginUser`, `logoutUser`, `refreshAccessToken`, `changeCurrentPassword`, `getCurrentUser`, `updateAccountDetails`, `updateUserAvatar`, `updateUserCover`, `getUserChannelProfile`, `authenticateUser`, `forgotPassword`, `deleteHistory` + private helper `generateAccessAndRefreshTokens(userId)`.

#### `VideoController`
`publishVideo`, `getVideoById`, `updateVideo`, `deleteVideo`, `togglePublishStatus`, `getAllVideos`.

#### `SubscriptionController`
`toggleSubscription`, `getUserChannelSubscribers`, `getSubscribedChannels`.

#### `RecommendationController`
`getRecommendations`.

#### `HealthController`
`healthcheck`.

---

### 3.7 Routes (`src/routes/`)

Each exports an Express `Router`. Planned refactor: each becomes a subclass of `BaseRoute`.

| Router | Mount Point |
|---|---|
| `userRouter` | `/api/v1/users` |
| `videoRouter` | `/api/v1/videos` |
| `subscriptionRouter` | `/api/v1/subscriptions` |
| `recommendationRouter` | `/api/v1/recommend` |
| `healthRouter` | `/api/v1/health` |

---

### 3.8 Application Bootstrap

#### `AppFactory` *(Factory)*
| Member | Visibility | Signature |
|---|---|---|
| `app` | private readonly | `Application` |
| `config` | private readonly | `AppConfig` |
| `constructor` | public | `(config: AppConfig)` — runs setup methods |
| `setupMiddlewares` | private | `void` — CORS, JSON, urlencoded, static, cookieParser |
| `setupRoutes` | private | `void` — mounts all 5 routers |
| `setupErrorHandling` | private | `void` — registers `errorHandler` last |
| `getApp` | public | `Application` |

**Patterns:** Factory Method, OCP, Composition over Inheritance, SRP.

#### `Index (startServer)`
Orchestrator (not a class): loads env → `DatabaseService.getInstance().connect()` → `new AppFactory({corsOrigin})` → `app.listen(PORT)` → `KeepAliveService.getInstance(url).start()`.

---

## 4. Relationship Summary

### 4.1 Inheritance / Realization
- `ApiError --|> Error`
- `BaseError --|> Error`
- `ApiResponse ..|> ApiResponseData`
- `User ..|> IUser`, `Video ..|> IVideo`, `Subscription ..|> ISubscription`
- `IUserModel --|> Model<IUser>`, `IVideoModel --|> Model<IVideo>`, `ISubscriptionModel --|> Model<ISubscription>`
- Planned: concrete Controllers `--|> BaseController`, concrete Services `--|> BaseService<T>`, concrete Routes `--|> BaseRoute`.

### 4.2 Composition (strong ownership, lifetime-bound)
- `AppFactory *-- Application`
- `KeepAliveService *-- ScheduledTask` (0..1)
- `BaseService *-- Model<T>`
- `BaseModel *-- Model<T>`

### 4.3 Aggregation (shared / referenced)
- `User o-- Video` (watchHistory: `0..*`)
- `AppFactory o-- AppConfig`

### 4.4 Associations (domain)
| From | Mult. | To | Mult. | Role |
|---|---|---|---|---|
| `Video` | `*` | `User` | `1` | `owner` |
| `Subscription` | `*` | `User` | `1` | `subscriber` |
| `Subscription` | `*` | `User` | `1` | `channel` |
| `User` | `1` | `Video` | `*` | `watchHistory` |

### 4.5 Dependencies (`..>`)
- Controllers → Models, ApiError, ApiResponse, asyncHandler, Cloudinary
- `AuthMiddleware ..> User, ApiError, asyncHandler, jsonwebtoken`
- `ErrorsMiddleware ..> ApiError`
- `DatabaseService ..> mongoose`
- `Index ..> DatabaseService, AppFactory, KeepAliveService, dotenv`

---

## 5. Design Patterns Catalog

| Pattern | Classes / Location |
|---|---|
| **Singleton** | `DatabaseService`, `KeepAliveService` |
| **Factory Method** | `AppFactory`, `mongoose.model()`, `UserModelService.registerUser`, `KeepAliveService.getInstance` |
| **Abstract Factory (loose)** | `AppFactory` (middleware + routes + error handler) |
| **Facade** | `UserModelService` (over `User` model) |
| **Template Method** | `BaseController.handleError/sendSuccess`, `BaseRoute.constructor→setupRoutes`, `AppFactory` setup sequence, `BaseService` CRUD skeleton |
| **Strategy** | `asyncHandler` (wraps any handler), `errorHandler` (ApiError vs Error), User model token generation |
| **Adapter** | `mongooseAggregatePaginate` plugin, `asyncHandler` (Promise → Express callback) |
| **Observer** | Mongoose `pre('save')` hook (password hashing), Express error middleware subscribes to `next(error)` |
| **Composite (conceptual)** | `Subscription` linking two `User` nodes as a self-referential graph |
| **DTO / ISP** | `UserDTO`, `LoginDTO`, `VideoDTO`, `SubscriptionDTO`, `AppConfig`, `ApiResponseData` |
| **SRP** | Every base class, service, middleware, and utility |
| **OCP** | `BaseRoute`, `BaseService`, `BaseController`, `AppFactory` |
| **LSP** | `ApiError`/`BaseError` with fixed prototype chain |
| **DIP** | `BaseService` depends on `Model<T>` abstraction; `startServer` depends on service abstractions |
| **Encapsulation** | Private constructors (singletons), private fields (`instance`, `job`, `app`) |

---

## 6. Runtime Collaboration (Bootstrap Flow)

```
Index.startServer()
  │
  ├─▶ DatabaseService.getInstance()           (Singleton)
  │       └─▶ connect() ── mongoose.connect()
  │
  ├─▶ new AppFactory({ corsOrigin })           (Factory)
  │       ├─ setupMiddlewares()  → cors / json / cookieParser / static
  │       ├─ setupRoutes()       → /api/v1/{users,videos,subscriptions,recommend,health}
  │       └─ setupErrorHandling()→ errorHandler (last)
  │
  ├─▶ appFactory.getApp().listen(PORT)
  │
  └─▶ KeepAliveService.getInstance(SERVER_URL).start()   (Singleton + cron)
```

Request flow (e.g. `POST /api/v1/users/login`):

```
Client → UserRouter → [AuthMiddleware?] → asyncHandler(loginUser)
  → User.findOne() → user.isPasswordCorrect() → generateAccess/RefreshTokens
  → res.cookie(...).json(new ApiResponse(200, {...}))
  (on error → next(err) → errorHandler → JSON error envelope)
```
