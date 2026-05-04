"""
Generate Architecture Report PDF for JS_Backend (Reelify)
Mirrors the AntriView architecture report format.
"""

from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Preformatted,
    HRFlowable, PageBreak, Table, TableStyle
)
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY
import os

OUTPUT = os.path.join(os.path.dirname(__file__), "JS_Backend_Architecture_Report.pdf")

# ── Colour palette (mirrors AntriView blue/black academic style) ─────────────
BLUE  = colors.HexColor("#1a4a8a")
LBLUE = colors.HexColor("#2563eb")
DGRAY = colors.HexColor("#1f2937")
LGRAY = colors.HexColor("#f3f4f6")
CODE_BG = colors.HexColor("#f8f8f8")
CODE_BORDER = colors.HexColor("#dddddd")

# ── Styles ────────────────────────────────────────────────────────────────────
base = getSampleStyleSheet()

title_style = ParagraphStyle(
    "MainTitle",
    parent=base["Title"],
    fontSize=22,
    leading=28,
    textColor=DGRAY,
    alignment=TA_CENTER,
    spaceAfter=6,
)
subtitle_style = ParagraphStyle(
    "Subtitle",
    parent=base["Normal"],
    fontSize=14,
    leading=18,
    textColor=colors.HexColor("#4b5563"),
    alignment=TA_CENTER,
    spaceAfter=4,
)
date_style = ParagraphStyle(
    "Date",
    parent=base["Normal"],
    fontSize=11,
    textColor=colors.HexColor("#6b7280"),
    alignment=TA_CENTER,
    spaceAfter=0,
)
h1_style = ParagraphStyle(
    "H1",
    parent=base["Heading1"],
    fontSize=16,
    leading=22,
    textColor=BLUE,
    spaceBefore=18,
    spaceAfter=6,
    borderPadding=(0, 0, 4, 0),
)
h2_style = ParagraphStyle(
    "H2",
    parent=base["Heading2"],
    fontSize=13,
    leading=18,
    textColor=LBLUE,
    spaceBefore=12,
    spaceAfter=4,
    fontName="Helvetica-Bold",
)
body_style = ParagraphStyle(
    "Body",
    parent=base["Normal"],
    fontSize=10,
    leading=15,
    textColor=DGRAY,
    spaceAfter=6,
    alignment=TA_JUSTIFY,
)
bullet_style = ParagraphStyle(
    "Bullet",
    parent=body_style,
    leftIndent=18,
    bulletIndent=6,
    spaceBefore=2,
    spaceAfter=2,
)
code_style = ParagraphStyle(
    "Code",
    parent=base["Code"],
    fontSize=8,
    leading=12,
    fontName="Courier",
    textColor=DGRAY,
    backColor=CODE_BG,
    leftIndent=8,
    rightIndent=8,
    spaceBefore=4,
    spaceAfter=4,
    borderColor=CODE_BORDER,
    borderWidth=0.5,
    borderPadding=6,
    borderRadius=3,
)
caption_style = ParagraphStyle(
    "Caption",
    parent=base["Normal"],
    fontSize=8.5,
    leading=12,
    textColor=colors.HexColor("#6b7280"),
    alignment=TA_CENTER,
    spaceAfter=8,
)
bold_label_style = ParagraphStyle(
    "BoldLabel",
    parent=body_style,
    fontName="Helvetica-Bold",
    spaceAfter=2,
)

def h1(text):
    num, *rest = text.split(" ", 1)
    return Paragraph(f"{num} {rest[0] if rest else ''}", h1_style)

def h2(text):
    return Paragraph(text, h2_style)

def body(text):
    return Paragraph(text, body_style)

def bullet(text):
    return Paragraph(f"• {text}", bullet_style)

def bold(label, text=""):
    if text:
        return Paragraph(f"<b>{label}</b>: {text}", body_style)
    return Paragraph(f"<b>{label}</b>", bold_label_style)

def code(text, caption_text=None):
    items = [Preformatted(text, code_style)]
    if caption_text:
        items.append(Paragraph(f"Listing: {caption_text}", caption_style))
    return items

def sp(n=6):
    return Spacer(1, n)

def hr():
    return HRFlowable(width="100%", thickness=0.5, color=colors.HexColor("#e5e7eb"), spaceAfter=4, spaceBefore=4)

# ── Document ──────────────────────────────────────────────────────────────────
doc = SimpleDocTemplate(
    OUTPUT,
    pagesize=letter,
    leftMargin=1*inch,
    rightMargin=1*inch,
    topMargin=1*inch,
    bottomMargin=1*inch,
    title="JS_Backend (Reelify) — System Design & Architecture Report",
    author="Claude Code",
)

story = []

# ─── TITLE PAGE ───────────────────────────────────────────────────────────────
story += [
    Spacer(1, 1.8*inch),
    Paragraph("JS_Backend (Reelify)", title_style),
    Spacer(1, 10),
    Paragraph("System Design &amp; Code Architecture Analysis", subtitle_style),
    Spacer(1, 14),
    Paragraph("April 29, 2026", date_style),
    PageBreak(),
]

# ─── TABLE OF CONTENTS ────────────────────────────────────────────────────────
toc_data = [
    ["1", "Project Overview", "3"],
    ["", "1.1  Purpose", "3"],
    ["", "1.2  Key Features", "3"],
    ["", "1.3  Tech Stack", "3"],
    ["", "1.4  High-Level Architecture Summary", "3"],
    ["2", "System Architecture", "3"],
    ["", "2.1  Architecture Style", "3"],
    ["", "2.2  Core Components", "3"],
    ["", "2.3  Data Flow (Overview)", "4"],
    ["3", "Code Structure Breakdown", "4"],
    ["", "3.1  Folder Structure and Responsibilities", "4"],
    ["", "3.2  Dependency Relationships (Layering)", "4"],
    ["4", "Data Flow & Lifecycle", "4"],
    ["", "4.1  Request Flow (Step-by-Step)", "4"],
    ["", "4.2  App Bootstrapping", "5"],
    ["", "4.3  AppFactory Composition Root", "5"],
    ["5", "Design Principles Used (Mapped to Code)", "6"],
    ["", "5.1  SOLID: Single Responsibility Principle (SRP)", "6"],
    ["", "5.2  SOLID: Open/Closed Principle (OCP)", "6"],
    ["", "5.3  SOLID: Liskov Substitution Principle (LSP)", "7"],
    ["", "5.4  SOLID: Dependency Inversion Principle (DIP)", "7"],
    ["", "5.5  DRY: Template Method in Base Classes", "8"],
    ["", "5.6  KISS: Explicit Composition", "8"],
    ["6", "Design Patterns Used (Mapped to Code)", "8"],
    ["", "6.1  Singleton Pattern", "8"],
    ["", "6.2  Factory Method Pattern", "9"],
    ["", "6.3  Template Method Pattern", "9"],
    ["", "6.4  Strategy + Adapter Pattern (asyncHandler)", "9"],
    ["", "6.5  Observer Pattern (Mongoose pre-save hook / Error middleware)", "10"],
    ["", "6.6  Facade Pattern (UserModelService)", "10"],
    ["", "6.7  Adapter Pattern (mongooseAggregatePaginate Plugin)", "10"],
    ["7", "Database Design & Schema", "11"],
    ["8", "Advanced System Design Concepts", "11"],
    ["9", "Q&A Section", "12"],
    ["10", "Strengths & Weaknesses", "13"],
    ["11", "Conclusion", "13"],
]

toc_table = Table(
    [[Paragraph(f"<font color='#1a4a8a'><b>{r[0]}</b></font>", body_style) if r[0].isdigit() else Paragraph("", body_style),
      Paragraph(f"<font color='#2563eb'>{r[1]}</font>", body_style),
      Paragraph(r[2], body_style)] for r in toc_data],
    colWidths=[0.35*inch, 5.3*inch, 0.45*inch],
)
toc_table.setStyle(TableStyle([
    ("VALIGN", (0,0), (-1,-1), "TOP"),
    ("TOPPADDING", (0,0), (-1,-1), 1),
    ("BOTTOMPADDING", (0,0), (-1,-1), 1),
]))

story += [
    Paragraph("Contents", ParagraphStyle("TOCTitle", parent=h1_style, fontSize=18, spaceAfter=12)),
    toc_table,
    PageBreak(),
]

# ─── SECTION 1: PROJECT OVERVIEW ──────────────────────────────────────────────
story += [h1("1 Project Overview"), hr()]

story += [
    h2("1.1 Purpose"),
    body("JS_Backend (Reelify) is a TypeScript + Node.js + Express backend for a YouTube-like "
         "video-sharing platform. It handles user authentication (JWT + refresh tokens), video "
         "management, subscriptions, watch history, and a channel-profile aggregation pipeline. "
         "It is structured around a clean layered architecture with explicit OOP base classes to "
         "enforce consistency across all contributors."),
    sp(),

    h2("1.2 Key Features"),
    bullet("<b>Auth</b>: Register, login, logout, refresh-token rotation, change-password, and optional-auth routes."),
    bullet("<b>Users</b>: Avatar / cover-image upload via Cloudinary, channel-profile aggregation with subscriber counts."),
    bullet("<b>Videos</b>: CRUD with file upload (Multer), view counting, and aggregation-based pagination."),
    bullet("<b>Subscriptions</b>: Subscribe / unsubscribe, list subscribers and subscribed channels."),
    bullet("<b>Recommendations</b>: Dedicated recommendation router."),
    bullet("<b>Health</b>: <tt>/api/v1/health</tt> endpoint — used by KeepAliveService to prevent free-tier sleep."),
    sp(),

    h2("1.3 Tech Stack"),
    bullet("<b>Runtime</b>: Node.js (ES modules), TypeScript 5."),
    bullet("<b>Framework</b>: Express 4."),
    bullet("<b>Database</b>: MongoDB via Mongoose 9."),
    bullet("<b>Auth</b>: JWT (jsonwebtoken), bcrypt password hashing, HTTP-only cookies."),
    bullet("<b>File Upload</b>: Multer (disk storage) + Cloudinary CDN."),
    bullet("<b>Scheduler</b>: node-cron (KeepAliveService)."),
    bullet("<b>Build</b>: tsc → dist/, nodemon for dev."),
    sp(),

    h2("1.4 High-Level Architecture Summary"),
    body("The codebase follows a <b>layered, OOP-driven architecture</b> with abstract base classes "
         "providing shared contract enforcement across all routes, controllers, services, and models:"),
    bullet("<b>Presentation</b>: Express routers + controllers (HTTP boundary)."),
    bullet("<b>Service Layer</b>: UserModelService and BaseService wrapping Mongoose operations."),
    bullet("<b>Infrastructure</b>: DatabaseService (Singleton), KeepAliveService (Singleton), Cloudinary utility."),
    bullet("<b>Cross-cutting</b>: ApiError / ApiResponse value objects, asyncHandler adapter, error middleware."),
    sp(),
]

# ─── SECTION 2: SYSTEM ARCHITECTURE ──────────────────────────────────────────
story += [h1("2 System Architecture"), hr()]

story += [
    h2("2.1 Architecture Style"),
    bold("Layered monolith", "a single deployable TypeScript service compiled to dist/. "
         "Not microservices; request processing is synchronous HTTP with async MongoDB I/O via Mongoose."),
    sp(),

    h2("2.2 Core Components"),
    bullet("<b>src/index.ts</b>: Process entrypoint — orchestrates DB connect, AppFactory, KeepAlive."),
    bullet("<b>src/app.ts (AppFactory)</b>: Factory that builds and returns the configured Express Application."),
    bullet("<b>src/base/</b>: Abstract base classes — BaseController, BaseRoute, BaseService, BaseError."),
    bullet("<b>src/routes/</b>: Feature routers mounted under <tt>/api/v1/*</tt>."),
    bullet("<b>src/controllers/</b>: Request handlers using asyncHandler + ApiError/ApiResponse."),
    bullet("<b>src/models/</b>: Mongoose schemas with instance/static methods (User, Video, Subscription, BaseModel)."),
    bullet("<b>src/services/</b>: DatabaseService (Singleton), UserModelService (Facade)."),
    bullet("<b>src/utils/</b>: ApiError, ApiResponse, asyncHandler, KeepAliveService, cloudinary, sendEmail."),
    bullet("<b>src/middlewares/</b>: auth.middleware, errors.middleware, multer.middleware, optionalAuth.middleware."),
    sp(),

    h2("2.3 Data Flow (Overview)"),
    body("A request enters Express, passes through security + auth middleware, is routed to a controller "
         "function (wrapped in asyncHandler), which calls Mongoose model methods or the UserModelService, "
         "and responds with an ApiResponse object. Any thrown ApiError is caught by asyncHandler and "
         "forwarded to the global error middleware."),
    sp(),
]

# ─── SECTION 3: CODE STRUCTURE ────────────────────────────────────────────────
story += [h1("3 Code Structure Breakdown"), hr()]

story += [
    h2("3.1 Folder Structure and Responsibilities"),
    bullet("<b>src/index.ts</b>: Bootstrap — DB + AppFactory + KeepAlive."),
    bullet("<b>src/app.ts</b>: AppFactory — middleware, routes, error-handler composition."),
    bullet("<b>src/base/BaseController.ts</b>: Abstract — handleError(), sendSuccess() template methods."),
    bullet("<b>src/base/BaseRoute.ts</b>: Abstract — enforces setupRoutes() via Template Method."),
    bullet("<b>src/base/BaseService.ts</b>: Generic CRUD service with injected Mongoose Model<T>."),
    bullet("<b>src/base/BaseError.ts</b>: Extensible error hierarchy (LSP-correct prototype chain)."),
    bullet("<b>src/services/DatabaseService.ts</b>: Singleton MongoDB connection manager."),
    bullet("<b>src/services/UserModelService.ts</b>: Facade over Mongoose User model."),
    bullet("<b>src/utils/ApiError.ts / ApiResponse.ts</b>: Typed value-object wrappers for HTTP I/O."),
    bullet("<b>src/utils/asyncHandler.ts</b>: Strategy + Adapter HOF — wraps async handlers for Express."),
    bullet("<b>src/utils/KeepAliveService.ts</b>: Singleton cron-based health pinger."),
    sp(),

    h2("3.2 Dependency Relationships (Layering)"),
    bullet("Routes depend on controllers and middleware (presentation layer)."),
    bullet("Controllers depend on Mongoose models directly or via service layer (UserModelService)."),
    bullet("Services (DatabaseService, UserModelService) depend on Mongoose abstractions."),
    bullet("All layers depend on cross-cutting utilities: ApiError, ApiResponse, asyncHandler."),
    bullet("BaseController / BaseRoute / BaseService are depended upon by all concrete implementations."),
    sp(),
]

# ─── SECTION 4: DATA FLOW & LIFECYCLE ────────────────────────────────────────
story += [h1("4 Data Flow & Lifecycle"), hr()]

story += [
    h2("4.1 Request Flow (Step-by-Step)"),
    bold("1. Startup",  "DatabaseService.getInstance().connect() ensures one MongoDB connection."),
    bold("2. App Build", "new AppFactory(config).getApp() registers middleware, routes, error-handler."),
    bold("3. Middleware", "CORS, JSON parsing, cookieParser, static files."),
    bold("4. Auth",      "verifyJWT middleware attaches req.user on protected routes; optionalAuth for public+private."),
    bold("5. Routing",   "Feature routers dispatch to controller methods wrapped in asyncHandler."),
    bold("6. Response",  "Controllers throw ApiError (caught by asyncHandler → error middleware) or return new ApiResponse()."),
    sp(4),

    h2("4.2 App Bootstrapping"),
]
story += code(
"""// src/index.ts
async function startServer(): Promise<void> {
  // Singleton — one DB connection
  const dbService = DatabaseService.getInstance();
  await dbService.connect();

  // Factory — builds the Express app
  const appFactory = new AppFactory({ corsOrigin: CORS_ORIGIN });
  const app = appFactory.getApp();

  app.listen(PORT, '0.0.0.0', () => {
    // Singleton cron — prevent free-tier sleep
    const keepAlive = KeepAliveService.getInstance(SERVER_URL);
    keepAlive.start();
  });
}""", "src/index.ts — Startup orchestration")

story += [sp(4), h2("4.3 AppFactory Composition Root")]
story += code(
"""// src/app.ts
export class AppFactory {
  private readonly app: Application;

  constructor(private readonly config: AppConfig) {
    this.app = express();
    this.setupMiddlewares(); // SRP: one concern per method
    this.setupRoutes();      // OCP: add routes without touching middleware
    this.setupErrorHandling();
  }

  private setupRoutes(): void {
    this.app.use('/api/v1/users',         userRouter);
    this.app.use('/api/v1/videos',        videoRouter);
    this.app.use('/api/v1/subscriptions', subscriptionRouter);
    this.app.use('/api/v1/recommend',     recommendationRouter);
    this.app.use('/api/v1/health',        healthRouter);
  }

  getApp(): Application { return this.app; }
}""", "src/app.ts — AppFactory")

story.append(PageBreak())

# ─── SECTION 5: DESIGN PRINCIPLES ────────────────────────────────────────────
story += [h1("5 Design Principles Used (Mapped to Code)"), hr()]

story += [
    h2("5.1 SOLID: Single Responsibility Principle (SRP)"),
    bold("Explanation", "Every class/module owns exactly one axis of change."),
    bold("Why it matters", "Limits the blast radius of a change — editing the error response "
         "shape should not touch authentication or route registration."),
    bold("Where implemented"),
    bullet("<b>AppFactory</b>: three private methods each own one concern — middleware, routes, error-handler."),
    bullet("<b>DatabaseService</b>: only manages the Mongoose connection lifecycle."),
    bullet("<b>KeepAliveService</b>: only schedules periodic health pings."),
    bullet("<b>asyncHandler</b>: only wraps async functions for Express compatibility."),
    bullet("<b>ApiError / ApiResponse</b>: model error and success response shapes — nothing else."),
    sp(4),
]
story += code(
"""// src/app.ts — each private method owns ONE concern
private setupMiddlewares(): void { /* cors, json, static */ }
private setupRoutes(): void      { /* route mounting only  */ }
private setupErrorHandling(): void { this.app.use(errorHandler); }""",
"SRP in AppFactory")

story += [
    sp(4),
    h2("5.2 SOLID: Open/Closed Principle (OCP)"),
    bold("Explanation", "Classes are open for extension but closed for modification."),
    bold("Why it matters", "Adding a new route group, a new controller, or a new error type "
         "requires writing new code — not editing existing, tested code."),
    bold("Where implemented"),
    bullet("<b>BaseRoute</b>: adding a new route file means extending BaseRoute and implementing "
           "setupRoutes() — BaseRoute itself never changes."),
    bullet("<b>BaseService</b>: new services (e.g. VideoService) extend BaseService<IVideo> "
           "with model-specific logic without modifying generic CRUD."),
    bullet("<b>BaseError → ApiError</b>: the error middleware handles any instanceof BaseError "
           "uniformly — no code change needed when adding new error subtypes."),
    sp(4),
]
story += code(
"""// src/base/BaseRoute.ts
export abstract class BaseRoute {
  public readonly router: Router;
  constructor() {
    this.router = Router();
    this.setupRoutes(); // Template Method hook — called at construction
  }
  abstract setupRoutes(): void; // Subclass EXTENDS without touching BaseRoute
}

// New route file — zero changes to BaseRoute
class HealthRoute extends BaseRoute {
  setupRoutes() { this.router.get('/', healthCheck); }
}""", "OCP in BaseRoute")

story += [
    sp(4),
    h2("5.3 SOLID: Liskov Substitution Principle (LSP)"),
    bold("Explanation", "Subclasses must be substitutable for their parent without breaking callers."),
    bold("Why it matters", "TypeScript transpilation to ES5 breaks the prototype chain for custom "
         "Error subclasses — instanceof checks silently fail unless fixed explicitly."),
    bold("Where implemented"),
    bullet("<b>BaseError</b>: calls Object.setPrototypeOf(this, BaseError.prototype) so that "
           "instanceof BaseError works correctly at runtime even after tsc compilation."),
    bullet("<b>ApiError extends Error</b>: same fix — ensures the Express error middleware's "
           "instanceof ApiError check is reliable."),
    sp(4),
]
story += code(
"""// src/base/BaseError.ts
export class BaseError extends Error {
  constructor(statusCode, message, errors = [], data = null, stack?) {
    super(message);
    this.statusCode = statusCode;
    this.success    = false;
    // LSP FIX: correct prototype chain after TypeScript ES5 transpile
    Object.setPrototypeOf(this, BaseError.prototype);
    if (stack) { this.stack = stack; }
    else { Error.captureStackTrace(this, this.constructor); }
  }
}""", "LSP fix in BaseError.ts")

story += [
    sp(4),
    h2("5.4 SOLID: Dependency Inversion Principle (DIP)"),
    bold("Explanation", "High-level modules should not depend on low-level details; "
         "both should depend on abstractions."),
    bold("Why it matters", "Swapping MongoDB for another DB, or replacing Mongoose, "
         "should not require rewriting controllers or route handlers."),
    bold("Where implemented"),
    bullet("<b>index.ts</b>: calls DatabaseService.getInstance().connect() — never touches "
           "mongoose.connect() directly."),
    bullet("<b>BaseService<T></b>: constructor accepts a Model<T> abstraction; concrete services "
           "inject their own Mongoose model at construction time."),
    bullet("<b>Controllers</b>: depend on the UserModelService abstraction, not on the User "
           "Mongoose model directly."),
    sp(4),
]
story += code(
"""// src/base/BaseService.ts
export abstract class BaseService<T extends Document> {
  // DIP: accepts Model<T> abstraction — not a specific concrete model
  constructor(protected readonly model: Model<T>) {}

  async findById(id: string): Promise<T | null> {
    return await this.model.findById(id); // Delegates to injected abstraction
  }
}

// Concrete service injects the concrete model at instantiation time
class VideoService extends BaseService<IVideo> {
  constructor() { super(Video); } // only THIS line knows about 'Video'
}""", "DIP in BaseService.ts")

story.append(PageBreak())

story += [
    h2("5.5 DRY: Template Method in Base Classes"),
    bold("Explanation", "A pattern that applies once (e.g. CRUD boilerplate, error handling, "
         "route registration) should have one canonical location."),
    bold("Where implemented"),
    bullet("<b>BaseController.handleError() / sendSuccess()</b>: every controller inherits the "
           "same response-building logic — no duplication across user, video, subscription controllers."),
    bullet("<b>BaseService CRUD methods</b>: create, findById, updateById, deleteById are "
           "implemented once; all concrete services reuse without copying."),
    sp(4),

    h2("5.6 KISS: Explicit Composition Without Framework Magic"),
    bold("Explanation", "Prefer explicit wiring over magic convention/reflection."),
    bold("Where implemented"),
    bullet("<b>AppFactory</b>: explicitly calls setupMiddlewares(), setupRoutes(), setupErrorHandling() "
           "in the constructor — the order is readable and not inferred."),
    bullet("<b>asyncHandler</b>: a single 5-line function instead of a decorator framework."),
    bullet("Manual DI — no IoC container; dependencies are passed through constructors."),
    sp(),
]

# ─── SECTION 6: DESIGN PATTERNS ───────────────────────────────────────────────
story += [h1("6 Design Patterns Used (Mapped to Code)"), hr()]

story += [
    h2("6.1 Singleton Pattern"),
    bold("Intent", "Ensure only one instance of a class is ever created."),
    bold("Where used", "DatabaseService and KeepAliveService — both use private constructor + "
         "static getInstance()."),
    bold("Why chosen", "Prevents duplicate MongoDB connections or multiple competing cron jobs."),
    sp(4),
]
story += code(
"""// src/services/DatabaseService.ts
export class DatabaseService {
  private static instance: DatabaseService;
  private constructor() {} // prevents external 'new'

  static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }
}""", "Singleton in DatabaseService.ts")

story += [
    sp(4),
    h2("6.2 Factory Method Pattern"),
    bold("Intent", "Encapsulate object creation — callers receive a product without knowing "
         "how it was built."),
    bold("Where used"),
    bullet("<b>AppFactory.getApp()</b>: returns a fully configured Express Application. "
           "index.ts never calls express() or app.use() directly."),
    bullet("<b>User.generateAccessToken() / generateRefreshToken()</b>: model instance "
           "methods act as factories that produce signed JWT strings."),
    bullet("<b>mongoose.model(...)</b>: the Mongoose factory call that produces the typed model proxy."),
    sp(4),
]
story += code(
"""// src/app.ts
export class AppFactory {
  getApp(): Application {
    return this.app; // Caller gets the product without knowing build details
  }
}

// src/index.ts — Factory Method usage
const appFactory = new AppFactory({ corsOrigin: CORS_ORIGIN });
const app = appFactory.getApp(); // Receives configured app""",
"Factory Method in AppFactory")

story += [
    sp(4),
    h2("6.3 Template Method Pattern"),
    bold("Intent", "Define a skeleton algorithm in a base class; let subclasses fill in specific steps."),
    bold("Where used"),
    bullet("<b>BaseRoute constructor</b>: calls this.setupRoutes() — concrete subclasses "
           "provide the body."),
    bullet("<b>BaseController</b>: handleError() and sendSuccess() are reusable skeleton steps "
           "that all controllers call."),
    bullet("<b>AppFactory constructor</b>: calls setupMiddlewares() → setupRoutes() → setupErrorHandling() "
           "in a fixed sequence (Template Method flavour)."),
    sp(4),
]
story += code(
"""// src/base/BaseRoute.ts
export abstract class BaseRoute {
  constructor() {
    this.router = Router();
    this.setupRoutes(); // Template: always called, always at construction
  }
  abstract setupRoutes(): void; // Step filled in by each concrete subclass
}

// src/base/BaseController.ts — skeleton response methods
protected handleError(error: unknown, res: Response): void {
  if (error instanceof ApiError) { res.status(error.statusCode).json({...}); }
  else { res.status(500).json({ message: 'Unknown error' }); }
}""", "Template Method in BaseRoute & BaseController")

story.append(PageBreak())

story += [
    h2("6.4 Strategy + Adapter Pattern (asyncHandler)"),
    bold("Intent (Strategy)", "Wrap any async handler as an interchangeable strategy with unified "
         "error-forwarding behaviour."),
    bold("Intent (Adapter)", "Convert an async function (Promise-based) to the synchronous "
         "Express middleware signature."),
    bold("Where used", "src/utils/asyncHandler.ts — wraps every controller method."),
    sp(4),
]
story += code(
"""// src/utils/asyncHandler.ts
export const asyncHandler = (requestHandler: AsyncRequestHandler) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    // Adapter: converts async fn → sync Express callback
    // Strategy: error-forwarding is defined ONCE, applied to any handler
    Promise.resolve(requestHandler(req, res, next))
      .catch((error: Error) => next(error));
  };
};

// Usage in every controller:
const registerUser = asyncHandler(async (req, res) => { ... });""",
"Strategy + Adapter in asyncHandler.ts")

story += [
    sp(4),
    h2("6.5 Observer Pattern (Mongoose pre-save hook + Error Middleware)"),
    bold("Intent", "React to events without the emitter knowing about the subscriber."),
    bold("Where used"),
    bullet("<b>userSchema.pre('save')</b>: Mongoose fires this hook before every save — the "
           "password is hashed automatically without any controller calling bcrypt explicitly."),
    bullet("<b>errors.middleware.ts</b>: registered as the last Express handler — acts as a "
           "global subscriber to all next(error) calls emitted anywhere in the app."),
    sp(4),
]
story += code(
"""// src/models/user.model.ts
// Observer: fires BEFORE every save — hashes password if modified
userSchema.pre<IUser>('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// src/middlewares/errors.middleware.ts
// Observer: receives all next(error) calls from any route/controller
const errorHandler = (err, _req, res, _next) => {
  const statusCode = err instanceof ApiError ? err.statusCode : 500;
  res.status(statusCode).json({ success: false, message: err.message });
};""", "Observer in user.model.ts + errors.middleware.ts")

story += [
    sp(4),
    h2("6.6 Facade Pattern (UserModelService)"),
    bold("Intent", "Provide a simplified interface over a complex subsystem."),
    bold("Where used", "src/services/UserModelService.ts — wraps Mongoose User model with "
         "intention-revealing methods so controllers never call User.findOne() with raw queries."),
    sp(4),
]
story += code(
"""// src/services/UserModelService.ts
export class UserModelService {
  // Facade: hides '$or' query shape from callers
  async registerUser(userData: UserDTO): Promise<IUser> {
    const existing = await User.findOne({
      $or: [{ username: userData.username }, { email: userData.email }]
    });
    if (existing) throw new ApiError(409, 'User already exists');
    return await User.create(userData);
  }
  // Simple intention-revealing names hide Mongoose internals
  async findUserByEmail(email: string) { return User.findOne({ email }); }
  async clearRefreshToken(userId: string) {
    await User.findByIdAndUpdate(userId, { refreshToken: null });
  }
}""", "Facade in UserModelService.ts")

story += [
    sp(4),
    h2("6.7 Adapter Pattern (mongooseAggregatePaginate Plugin)"),
    bold("Intent", "Allow incompatible interfaces to work together without modifying either."),
    bold("Where used", "video.model.ts and user.model.ts — the third-party "
         "mongoose-aggregate-paginate-v2 plugin is adapted into the Mongoose schema "
         "via schema.plugin(), making aggregation pagination available without schema modification."),
    sp(4),
]
story += code(
"""// src/models/video.model.ts
// Adapter: plugs third-party pagination API into Mongoose schema
videoSchema.plugin(mongooseAggregatePaginate);

// Now Video.aggregatePaginate(...) is available as if it were native Mongoose""",
"Adapter Pattern in video.model.ts")

story.append(PageBreak())

# ─── SECTION 7: DATABASE DESIGN ───────────────────────────────────────────────
story += [h1("7 Database Design & Schema"), hr()]

story += [
    h2("7.1 Design Choices"),
    bullet("<b>MongoDB + Mongoose</b>: document-oriented storage suits the denormalized video/user/subscription data."),
    bullet("<b>UUID-equivalent</b>: MongoDB ObjectId primary keys used across all collections."),
    bullet("<b>Indexes</b>: username (unique + index) and fullName (index) on User; enables fast lookups."),
    bullet("<b>Relationships via references</b>: Video.owner → User ObjectId; "
           "Subscription.subscriber + .channel → User ObjectId (both with ref: 'User')."),
    bullet("<b>Watch history</b>: stored as an array of Video ObjectId refs on the User document."),
    bullet("<b>Instance methods on models</b>: isPasswordCorrect(), generateAccessToken(), "
           "generateRefreshToken(), incrementViews() — domain logic lives close to the data."),
    bullet("<b>Static query methods</b>: findByUsername(), findByEmail() on User; "
           "findPublished(), findByOwner() on Video — abstraction over raw filter objects."),
    bullet("<b>Aggregate pagination</b>: mongooseAggregatePaginate plugin on User and Video "
           "enables cursor-based pagination for channel subscriber feeds and video listings."),
    sp(),
]
story += code(
"""// src/models/user.model.ts (schema excerpt)
const userSchema = new Schema<IUser>({
  username:     { type: String, required: true, unique: true, index: true },
  email:        { type: String, required: true, unique: true },
  password:     { type: String, required: true },   // stored hashed (bcrypt)
  refreshToken: { type: String },
  watchHistory: [{ type: Schema.Types.ObjectId, ref: 'Video' }],
  avatar:       { type: String, required: true },
  coverImage:   { type: String },
}, { timestamps: true });

// src/models/video.model.ts (key fields)
const videoSchema = new Schema<IVideo>({
  owner:       { type: Schema.Types.ObjectId, ref: 'User', required: true },
  views:       { type: Number, default: 0 },
  isPublished: { type: Boolean, default: true },
}, { timestamps: true });""", "MongoDB schemas (User + Video)")

# ─── SECTION 8: ADVANCED SYSTEM DESIGN ───────────────────────────────────────
story += [h1("8 Advanced System Design Concepts (As Implemented)"), hr()]

story += [
    h2("8.1 Scalability (Practical Signals)"),
    bullet("<b>Mongoose connection pooling</b>: Mongoose maintains a connection pool internally; "
           "DatabaseService ensures only one pool is created (Singleton)."),
    bullet("<b>I/O concurrency</b>: async/await throughout; Node.js event loop handles concurrent requests."),
    bullet("<b>Aggregation pipeline</b>: MongoDB $lookup + $addFields used in getUserChannelProfile "
           "— efficient join-equivalent without N+1 queries."),
    sp(4),

    h2("8.2 Caching"),
    body("No explicit caching layer (Redis / in-memory) is implemented. Any caching strategy would "
         "be additive — the Facade (UserModelService) and BaseService are the natural integration points."),
    sp(4),

    h2("8.3 Load Balancing"),
    body("The service is stateless with JWT auth stored in HTTP-only cookies — no server-side sessions. "
         "This makes it horizontally scalable behind a load balancer, with MongoDB as shared state."),
    sp(4),

    h2("8.4 Fault Tolerance and Failure Modes"),
    bullet("<b>Startup failure</b>: DatabaseService.connect() throws; index.ts catches and calls "
           "process.exit(1) to trigger process-manager restarts."),
    bullet("<b>Error normalisation</b>: asyncHandler forwards all unhandled promise rejections to "
           "errorHandler, which returns structured JSON without leaking stack traces in production."),
    bullet("<b>Token expiry</b>: auth.middleware distinguishes TokenExpiredError (403) from "
           "JsonWebTokenError (401) — callers get actionable status codes."),
    bullet("<b>KeepAliveService</b>: catches ping failures gracefully — logs but does not crash the server."),
    sp(4),

    h2("8.5 Concurrency / Async Handling"),
    body("All database and external-API calls are awaited per request. asyncHandler ensures "
         "rejected promises are forwarded to Express error middleware rather than causing "
         "unhandled-rejection crashes. Long-running operations (Cloudinary uploads) block the "
         "handler but not other concurrent requests (Node event-loop model)."),
    sp(),
]

# ─── SECTION 9: Q&A ───────────────────────────────────────────────────────────
story.append(PageBreak())
story += [h1("9 Question & Answer Section"), hr()]

story += [
    h2("9.1 Beginner Level"),
    bold("Q: Is this a monolith or microservices?",
         "It is a layered monolith — a single Express app created by AppFactory and started by index.ts."),
    sp(4),
    bold("Q: Where is authentication handled?",
         "JWT Bearer / cookie auth is in src/middlewares/auth.middleware.js. "
         "It attaches req.user on protected routes. An optional variant (optionalAuth.middleware.js) "
         "attaches user only if a valid token is present."),
    sp(4),
    bold("Q: Where do errors go when a controller throws?",
         "asyncHandler catches the rejected promise and calls next(error). Express routes it to "
         "errors.middleware.ts, which serialises it as a structured JSON response."),
    sp(4),
    bold("Q: How are files uploaded?",
         "Multer middleware (multer.middleware.js) handles disk storage. The file path is then "
         "passed to uploadOnCloud() in src/utils/cloudinary.js, which uploads to Cloudinary CDN."),
    sp(8),

    h2("9.2 Intermediate Level"),
    bold("Q: What ensures only one MongoDB connection is created?",
         "DatabaseService uses the Singleton pattern — a private constructor and a static "
         "getInstance() that returns the same instance on every call."),
    sp(4),
    bold("Q: How does BaseService help concrete services?",
         "BaseService<T> provides generic create, findById, find, updateById, deleteById using a "
         "Mongoose Model<T> injected via the constructor (DIP). Concrete services extend it and "
         "add domain-specific methods without duplicating CRUD boilerplate."),
    sp(4),
    bold("Q: How does the aggregation pipeline avoid N+1 queries for channel profiles?",
         "getUserChannelProfile uses a single User.aggregate([...]) call with $lookup stages to "
         "join subscriptions, $addFields to compute counts, and $project to shape the output — "
         "one round-trip to MongoDB instead of one per subscriber."),
    sp(4),
    bold("Q: What is the benefit of asyncHandler over try/catch in every controller?",
         "asyncHandler is an Adapter + Strategy. It defines the catch+next forwarding once. "
         "Every controller becomes a pure async function; error plumbing is not repeated. "
         "This is a DRY + SRP win."),
    sp(8),

    h2("9.3 Advanced Level"),
    bold("Q: What scaling issues exist with the current Cloudinary upload flow?",
         "uploadOnCloud() is awaited synchronously inside the HTTP request handler. "
         "Large files block the handler for the duration of the upload. "
         "The fix: move uploads to a background job queue (Bull/BullMQ), "
         "return a job ID immediately, and notify the client when the upload completes."),
    sp(4),
    bold("Q: Where is there architectural drift?",
         "Controllers (user.controller.js etc.) are still in JavaScript while base classes "
         "and models are TypeScript. This creates a mixed-type boundary where TypeScript "
         "compiler cannot enforce contracts on the JS files. Migration to .ts is in progress."),
    sp(4),
    bold("Q: How would you add Redis caching without touching controllers?",
         "Wrap UserModelService (Facade) with a caching decorator or create a "
         "CachedUserModelService that extends or composes UserModelService. "
         "Because controllers depend on the service abstraction (DIP), swapping in "
         "the cached version only requires changing the instantiation site."),
    sp(),
]

# ─── SECTION 10: STRENGTHS & WEAKNESSES ───────────────────────────────────────
story.append(PageBreak())
story += [h1("10 Strengths &amp; Weaknesses"), hr()]

story += [
    h2("10.1 Strengths"),
    bullet("<b>Explicit OOP base classes</b>: BaseController, BaseRoute, BaseService, BaseError "
           "enforce a consistent contract for all contributors."),
    bullet("<b>True Singleton enforcement</b>: DatabaseService and KeepAliveService cannot be "
           "double-instantiated — protected by private constructors."),
    bullet("<b>asyncHandler eliminates boilerplate</b>: zero try/catch blocks needed in controllers; "
           "all error routing is centralised."),
    bullet("<b>LSP-correct error hierarchy</b>: Object.setPrototypeOf() ensures instanceof "
           "checks work after TypeScript compilation."),
    bullet("<b>MongoDB aggregation pipelines</b>: channel-profile and subscription queries "
           "are efficient single-trip aggregations."),
    bullet("<b>Token rotation strategy</b>: separate access/refresh token lifetimes with "
           "cookie-based secure storage."),
    sp(8),

    h2("10.2 Weaknesses / Improvement Opportunities"),
    bullet("<b>JS/TS mixed controllers</b>: controllers are .js while base classes are .ts, "
           "losing TypeScript's type-checking at the most important layer. Completing the "
           "migration would catch type errors at compile time."),
    bullet("<b>No service layer for most controllers</b>: controllers call Mongoose models "
           "directly rather than through a service abstraction. This makes unit testing "
           "harder (no seam to inject a mock). Following UserModelService's Facade pattern "
           "for VideoService, SubscriptionService would fix this."),
    bullet("<b>Synchronous file uploads block the event loop</b>: Cloudinary uploads are "
           "awaited inside HTTP handlers. Background job queues would improve tail latency."),
    bullet("<b>No input validation layer</b>: validation is done with ad-hoc if-checks in "
           "controllers. Adding Zod or express-validator at the route boundary would centralise "
           "validation and produce uniform error messages."),
    bullet("<b>No refresh-token rotation on use</b>: the current flow issues a new refresh token "
           "on login but not on every refresh call. Implementing rotation-on-use would prevent "
           "refresh-token replay attacks."),
    sp(8),

    h2("10.3 Refactoring Suggestions (Low Risk)"),
    body("1. Convert controller .js files to .ts to get full type-safety on req/res."),
    body("2. Create VideoService and SubscriptionService following UserModelService's Facade pattern."),
    body("3. Add Zod schemas at route boundaries for unified input validation."),
    body("4. Move Cloudinary uploads to a BullMQ job queue with a webhook callback."),
    body("5. Add refresh-token rotation on every /refresh-token call to mitigate replay attacks."),
    sp(),
]

# ─── SECTION 11: CONCLUSION ────────────────────────────────────────────────────
story += [h1("11 Conclusion"), hr()]
story += [
    body("JS_Backend (Reelify) demonstrates a well-structured, OOP-driven layered architecture "
         "with deliberate application of SOLID principles and multiple classical design patterns. "
         "The Singleton, Factory Method, Template Method, Strategy, Adapter, Facade, and Observer "
         "patterns are all present and mapped to concrete files. The largest quality gains would "
         "come from completing the TypeScript migration of controllers, adding a service abstraction "
         "layer for Video and Subscription, and introducing a background job queue for file uploads "
         "to improve scalability and testability."),
    sp(),
]

# ─── BUILD ────────────────────────────────────────────────────────────────────
doc.build(story)
print(f"PDF generated: {OUTPUT}")
