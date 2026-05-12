# Creational Design Patterns — Study & Presentation Notes

> Concise definitions, real-world examples, syntax shapes, and **when-to-use / when-to-avoid** rules for all five Creational Patterns **plus Object Pool**, anchored to this codebase.

---

## Quick Reference Table

| # | Pattern | One-Line Purpose |
|---|---------|-----------------|
| 1 | **Singleton** | One shared instance, one controlled access point |
| 2 | **Factory Method** | Let subclasses / creators decide what to create |
| 3 | **Abstract Factory** | Create families of related objects together |
| 4 | **Builder** | Construct complex objects step-by-step |
| 5 | **Prototype** | Create by cloning an existing object |
| + | **Object Pool** | Reuse expensive objects instead of recreating them |

---

## 1. Singleton Pattern

### Definition
Restricts a class to **one single instance** for its entire lifecycle and provides a global access point to it.

### Problem It Solves
Multiple uncontrolled instances of the same expensive resource (database client, config registry, logger) cause wasted connections, inconsistent state, and fragmented lifecycle management.

### Real-World Analogy
A country has one central **Reserve Bank**. Every financial institution uses it — no one creates a second one.

### Usages in Software
- Database connection client shared across a service
- Application-wide configuration registry
- Structured logger instance shared across modules

### Final Example — Real-World Software Design
> *"All repositories in the Tweet Service share one PrismaClient through `PrismaService`, preventing multiple database handshakes on every request."*

### Syntax Shape
```typescript
class PrismaService extends PrismaClient {
  private static _instance: PrismaService;

  static getInstance(): PrismaService {
    if (!PrismaService._instance) {
      PrismaService._instance = new PrismaService();
    }
    return PrismaService._instance;
  }
}

// Usage — always returns the SAME object
const db = PrismaService.getInstance();
```

### In This Project
- `auth-service/src/prisma.service.ts`
- `tweet-service/src/prisma.service.ts`
- `notification-service/src/prisma.service.ts`
- `user-service/src/prisma.service.ts`
- `media-service/src/prisma.service.ts`

### ✅ When to Use
- When exactly one object must coordinate actions across the system
- When creating the object is expensive (DB client, HTTP agent, config loader)
- When lifecycle must be tightly controlled (connect once, disconnect on shutdown)
- When shared state or shared access is required across many modules

### ❌ When to Avoid
- When multiple independent instances are intentionally needed (e.g., test isolation)
- When the shared state introduces hidden coupling between unrelated modules
- When it makes unit testing hard (mocks become difficult to inject)
- In distributed systems where "one instance" is meaningless across multiple processes

---

## 2. Factory Method Pattern

### Definition
Defines an **interface for creating an object**, but lets the subclass or creator decide which concrete class to instantiate.

### Problem It Solves
When a caller needs to create objects from a growing set of types, hardcoded `if/else` or `switch` chains inside handlers make the code brittle and hard to extend.

### Real-World Analogy
A **car factory** receives an order for "a vehicle." It internally decides whether to build a sedan, SUV, or truck based on the order type — the customer doesn't assemble it.

### Usages in Software
- Creating different notification types (in-app, email, push) per event
- Generating different report formats (PDF, CSV, Excel) per request
- Producing different payment gateway clients (Stripe, PayPal, Razorpay) per config

### Final Example — Real-World Software Design
> *"The `NotificationFactory` in the Notification Service decides whether to create an InApp, Email, or Push strategy based on the command type — the handler just asks for a strategy."*

### Syntax Shape
```typescript
interface NotificationStrategy {
  buildPayload(cmd: SendNotificationCommand): NotificationPayload;
}

class InAppStrategy implements NotificationStrategy { ... }
class EmailStrategy  implements NotificationStrategy { ... }
class PushStrategy   implements NotificationStrategy { ... }

class NotificationFactory {
  create(type: string): NotificationStrategy {
    if (type === 'TWEET_LIKED') return new InAppStrategy();
    if (type === 'PROMO')       return new EmailStrategy();
    return new PushStrategy();
  }
}

// Handler usage
const strategy = factory.create(command.type);
const payload  = strategy.buildPayload(command);
await repo.create(payload);
```

### In This Project
- Current: `notification-service/src/application/handlers/notification.handler.ts`
- Target:  `notification-service/src/domain/factories/notification.factory.ts`
- Target:  `notification-service/src/domain/strategies/in-app-notification.strategy.ts`

### ✅ When to Use
- When the exact type of object to create is determined at runtime
- When adding new variants should not require editing existing callers
- When creation logic is complex enough to deserve its own class
- When following Open/Closed Principle — open for extension, closed for modification

### ❌ When to Avoid
- When there is only one concrete product type (overcomplicated for one case)
- When the creation logic is trivially simple (`new Foo()`) and never varies
- When variant logic changes very rarely and only has two options

---

## 3. Abstract Factory Pattern

### Definition
Provides an interface for creating **families of related objects** without specifying their concrete classes.

### Problem It Solves
When a system needs grouped, consistent configuration or objects for different environments (dev / staging / prod), scattered `process.env` reads and mixed conditionals make the system incoherent and error-prone.

### Real-World Analogy
An **IKEA furniture range**: if you choose the "HEMNES" series, you get a matching bed frame, wardrobe, and drawer unit — all designed to work together. You don't pick parts from different series and hope they match.

### Usages in Software
- Creating environment-specific config bundles (URLs, CORS, security, logging)
- UI component libraries that produce matching button + input + modal per theme
- Platform-specific object creation (Windows UI vs macOS UI vs Linux UI)

### Final Example — Real-World Software Design
> *"A `ConfigFactory` in the API Gateway resolves to `DevConfigFactory` or `ProdConfigFactory` based on `NODE_ENV`, producing a coherent bundle of service URLs, security settings, and CORS rules."*

### Syntax Shape
```typescript
interface EnvironmentFactory {
  createUrlConfig():      UrlConfig;
  createSecurityConfig(): SecurityConfig;
  createLoggingConfig():  LoggingConfig;
}

class DevConfigFactory  implements EnvironmentFactory { ... }
class ProdConfigFactory implements EnvironmentFactory { ... }

function resolveFactory(env: string): EnvironmentFactory {
  if (env === 'production') return new ProdConfigFactory();
  return new DevConfigFactory();
}

// Bootstrap usage
const factory  = resolveFactory(process.env.NODE_ENV);
const urls     = factory.createUrlConfig();
const security = factory.createSecurityConfig();
```

### In This Project
- Current need: `api-gateway/src/main.ts`, `api-gateway/src/app.service.ts`
- Current need: `tweet-service/src/application/handlers/tweet-crud.handler.ts`
- Target:  `api-gateway/src/config/config.factory.ts`
- Target:  `api-gateway/src/config/prod-config.factory.ts`

### ✅ When to Use
- When the system must work across multiple environments with different but coherent settings
- When objects must be used together and mismatching would cause bugs
- When you want to replace an entire family by swapping one factory
- When building platform-agnostic or theme-agnostic systems

### ❌ When to Avoid
- When there is only one environment or one concrete family
- When the families rarely differ from each other
- When adding a new product type forces updates to every factory (interface gets bloated)

---

## 4. Builder Pattern

### Definition
Separates the **construction of a complex object** from its representation, allowing step-by-step creation with optional and required parts.

### Problem It Solves
Domain objects with many fields — especially optional ones — produce large, unreadable constructors. Argument-order bugs are common, and adding new fields breaks every call site.

### Real-World Analogy
Ordering a **custom pizza**: you pick base, sauce, cheese, toppings, and crust thickness one by one. You don't shout one long sentence listing all 12 ingredients at once.

### Usages in Software
- Building Tweet objects with optional media, mentions, location, quote context
- Constructing SQL query objects with optional WHERE, ORDER BY, LIMIT clauses
- Creating HTTP request objects with optional headers, auth, timeout, retries

### Final Example — Real-World Software Design
> *"The `TweetBuilder` in the Tweet Service chains `.withContent()`, `.withMediaUrls()`, and `.withOriginalTweetId()` before calling `.build()` — keeping creation readable as optional fields grow."*

### Syntax Shape
```typescript
class TweetBuilder {
  private props: Partial<Tweet> = {};

  withUserId(id: string)           { this.props.userId = id;           return this; }
  withContent(c: string)           { this.props.content = c;           return this; }
  withMediaUrls(urls: string[])    { this.props.mediaUrls = urls;      return this; }
  withOriginalTweetId(id: string)  { this.props.originalTweetId = id;  return this; }

  build(): Tweet {
    if (!this.props.userId || !this.props.content) throw new Error('Missing required fields');
    return new Tweet(
      this.props.userId,
      this.props.content,
      this.props.mediaUrls ?? [],
      this.props.originalTweetId ?? null,
    );
  }
}

// Handler usage
const tweet = new TweetBuilder()
  .withUserId(command.userId)
  .withContent(validatedContent.value)
  .withMediaUrls(command.mediaUrls)
  .build();
```

### In This Project
- Current entity: `tweet-service/src/domain/entities/tweet.entity.ts`
- Current handler: `tweet-service/src/application/handlers/tweet-crud.handler.ts`
- Target builder: `tweet-service/src/domain/builders/tweet.builder.ts`

### ✅ When to Use
- When an object has more than 4–5 constructor arguments, especially optional ones
- When the same construction process should produce different representations
- When argument order is error-prone and readability matters
- When you need to validate the object only after all parts are assembled

### ❌ When to Avoid
- When the object is simple and has only 1–2 fields (overkill)
- When all fields are always required with no variation
- When construction is a one-liner that is already readable
- When immutability is enforced at a framework level that handles it better

---

## 5. Prototype Pattern

### Definition
Creates new objects by **copying (cloning) an existing object** and modifying only what needs to change.

### Problem It Solves
When creation of a new object is really a derivation of an existing one, manually rebuilding every shared property is tedious, error-prone, and duplicates knowledge that the source object already holds.

### Real-World Analogy
A **document template**: instead of typing a new legal contract from scratch each time, a lawyer duplicates the approved template and changes only the client name, date, and specific clauses.

### Usages in Software
- Creating a retweet from an existing tweet (derive, don't rebuild)
- Cloning a configuration object for a variation test environment
- Duplicating an existing user role as the starting point for a new custom role

### Final Example — Real-World Software Design
> *"The `RetweetHandler` in the Tweet Service calls `originalTweet.cloneForRetweet(userId, comment)` — getting a fully derived retweet instead of manually reassembling all shared fields."*

### Syntax Shape
```typescript
class Tweet {
  // ... existing fields

  cloneForRetweet(newUserId: string, comment?: string): RetweetDraft {
    return {
      userId:         newUserId,
      content:        comment ?? `RT: ${this.content.slice(0, 240)}`,
      mediaUrls:      [],                   // retweets don't inherit media
      originalTweetId: this.id,
      likesCount:     0,
      retweetsCount:  0,
      createdAt:      new Date(),
    };
  }
}

// Handler usage
const draft   = original.cloneForRetweet(command.userId, command.comment);
const retweet = await tweetRepo.createFromDraft(draft);
```

### In This Project
- Current entity:  `tweet-service/src/domain/entities/tweet.entity.ts`
- Current handler: `tweet-service/src/application/handlers/tweet-social.handler.ts`
- Target method:   `cloneForRetweet()` on the `Tweet` entity

### ✅ When to Use
- When a new object is conceptually a variation of an existing object
- When object construction is expensive and an existing instance is available
- When copying and adjusting is faster and clearer than full reconstruction
- When many fields are shared and only a few differ

### ❌ When to Avoid
- When objects contain references to mutable shared state (shallow clone issues)
- When the new object is fundamentally different from the source
- When all fields always differ — cloning saves nothing
- When deep-cloning complex graphs is harder than just constructing fresh

---

## 6. Object Pool Pattern

### Definition
Maintains a **pool of reusable objects** and hands them out on request, returning them to the pool after use instead of destroying and recreating them.

### Problem It Solves
Creating and destroying expensive objects on every request (database connections, thread workers, parser instances) wastes resources, spikes latency, and reduces predictability of resource usage.

### Real-World Analogy
A **university equipment lab**: students borrow a camera from the desk, shoot their project, and return it. The lab doesn't buy and discard a new camera per student — it manages a tracked pool.

### Usages in Software
- Database connection pool (classic textbook example)
- HTTP/HTTPS client connection pool in gateway proxies
- Worker thread pool for CPU-bound background tasks

### Final Example — Real-World Software Design
> *"A `PrismaClientPool` in each microservice hands out client leases through `acquire()` and reclaims them via `release()`, making resource usage measurable and predictable."*

### Syntax Shape
```typescript
class PrismaClientPool {
  private idle:   PrismaClient[] = [];
  private active: Set<PrismaClient> = new Set();
  private readonly max = 5;

  acquire(): PrismaClient {
    const client = this.idle.pop() ?? this.createClient();
    this.active.add(client);
    return client;
  }

  release(client: PrismaClient): void {
    this.active.delete(client);
    this.idle.push(client);
  }

  stats() {
    return { idle: this.idle.length, active: this.active.size };
  }

  private createClient(): PrismaClient {
    if (this.active.size >= this.max) throw new Error('Pool exhausted');
    return new PrismaClient();
  }
}

// Usage
const client = pool.acquire();
try {
  await client.tweet.findMany({ where: { userId } });
} finally {
  pool.release(client);
}
```

> **Note:** Prisma already manages low-level database connection pooling internally.
> The Object Pool here is an **application-level logical pool** around client access — it is educational and observability-focused, not a replacement for Prisma internals.

### In This Project
- Resource boundary: all five `prisma.service.ts` files
- Target pool:       `*/src/infrastructure/persistence/prisma-client.pool.ts`

### ✅ When to Use
- When object creation is expensive (connections, parsers, workers)
- When objects are needed frequently but for short durations
- When you need to cap the max number of concurrent resource users
- When observability of active vs idle resources matters

### ❌ When to Avoid
- When objects are cheap to create and destroy (plain data classes)
- When objects hold state that makes safe reuse complex or risky
- When the framework already manages pooling (e.g., Prisma, pg-pool)
- When pool management complexity exceeds the benefit for the load level

---

## Pattern vs Layer Placement

```text
      ┌──────────────────────────────────────────────────────────┐
      │  Layer               Pattern(s)                          │
      ├──────────────────────────────────────────────────────────┤
      │  Bootstrap / Config  Abstract Factory                     │
      │  Domain              Builder · Prototype                  │
      │  Application         Factory Method (at domain seam)      │
      │  Infrastructure      Singleton · Object Pool              │
      └──────────────────────────────────────────────────────────┘
```

---

## One-Line Summary Per Pattern

| Pattern | One-Line Summary |
|---------|-----------------|
| Singleton | One Prisma client per service process, shared through DI |
| Factory Method | Command handler asks a factory for the right notification creator |
| Abstract Factory | Gateway resolves one environment factory for coherent config bundles |
| Builder | Tweet construction chains optional steps before a final `build()` |
| Prototype | A retweet derives from the original tweet via a clone method |
| Object Pool | Prisma-level client leases are tracked, reused, and released explicitly |
