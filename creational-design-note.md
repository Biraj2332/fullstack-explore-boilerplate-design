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

### Layman's Example
Your phone's **Settings app**. No matter which app you open, tapping Settings always opens the *same* system panel — your phone doesn't spin up a brand-new Settings screen each time. One panel, shared across everything.

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

### Layman's Example
A **vending machine**: you press the "Hot Drink" button and the machine internally decides whether to dispense coffee, tea, or hot chocolate — you don't pick the nozzle, mix the powder, or control the heating element yourself. You just asked for *a hot drink*.

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

### Layman's Example
Ordering a **console gaming bundle**: you pick the "PlayStation Bundle" or the "Xbox Bundle." Each bundle gives you a *matching* controller, power cable, and starter game. You never get an Xbox controller with a PlayStation cable — everything in the bundle fits together by design.

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

### Layman's Example
Building a **Lego set**: instructions guide you step by step — attach the base, add the walls, snap on the roof, stick the windows. Only after every step is done do you get the finished house. You never hand someone a pile of 300 random bricks and say "make a house" all at once.

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

### Layman's Example
**"Save As…" in Microsoft Word**: you have a perfectly formatted report. Instead of rebuilding the layout, fonts, and headers from scratch for next month's report, you open the old file, click *Save As*, rename it, and only change the data sections that differ.

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

### Layman's Example
A **taxi stand outside an airport**: taxis park and wait. A passenger takes one, the taxi drives them, then returns to the stand for the next passenger. The taxi company doesn't buy a brand-new taxi for every trip and scrap it afterward — they reuse a managed fleet.

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

---

## Interview & Tricky Q&A — 90 Questions

### Section A — General Creational Patterns (Q 1–10)

---

**Q1. What is the main purpose of Creational Design Patterns?**
> To control and encapsulate *how objects are created*, hiding the details of creation logic from the callers that use the objects.

---

**Q2. How many creational patterns are in the original Gang of Four (GoF) catalog?**
> Five: Singleton, Factory Method, Abstract Factory, Builder, Prototype. Object Pool is a well-known extension from enterprise patterns, not in the original GoF book.

---

**Q3. What separates a Creational pattern from a Structural one?**
> Creational patterns deal with *object creation*; Structural patterns deal with *how classes and objects are composed* into larger structures (e.g., Adapter, Decorator, Composite).

---

**Q4. Which creational pattern is NOT in the original GoF catalog?**
> Object Pool. It comes from enterprise and concurrency pattern catalogs but solves a real creational problem, so it is commonly taught alongside the GoF five.

---

**Q5. Can two creational patterns be used together in one system?**
> Yes. Builder and Abstract Factory are often paired: the Abstract Factory decides *which* builder to use, while the Builder assembles the final product step by step.

---

**Q6. Why are creational patterns more important in microservices than in monoliths?**
> Each microservice has its own lifecycle, dependencies, and infrastructure. Object creation is no longer a single application concern — it must be consistent within each isolated deployment unit.

---

**Q7. What does "encapsulating object creation" mean in practice?**
> The caller says *what* it needs, not *how* to build it. The factory, builder, or singleton manager decides the actual instantiation logic.

---

**Q8. When should you prefer a creational pattern over a direct `new` keyword?**
> When the type to create varies at runtime, when creation is expensive or complex, when you want to hide the concrete class from callers, or when you must control the number of instances.

---

**Q9. Which creational pattern hides the class hierarchy most effectively?**
> Abstract Factory — callers interact only with the factory interface and receive product interfaces; they never see or reference concrete class names.

---

**Q10. What is the difference between "who creates" (Factory Method) and "how many exist" (Singleton)?**
> Factory Method delegates creation responsibility to a specialized creator class. Singleton restricts the count of instances in existence. They solve orthogonal problems.

---

### Section B — Singleton (Q 11–25)

---

**Q11. What is the Singleton Pattern in one sentence?**
> It ensures a class has at most one instance and provides a global access point to that instance.

---

**Q12. How do you ensure thread safety in a Singleton in Java / TypeScript?**
> In Java: use `synchronized` or static initialization. In Node.js/TypeScript: the single-threaded event loop means module-level singletons are inherently safe; in Worker threads, each thread has its own scope.

---

**Q13. What is the difference between eager and lazy Singleton initialization?**
> **Eager**: instance created when the class loads, even if unused. **Lazy**: instance created only on first `getInstance()` call. Lazy saves resources but requires a null check.

---

**Q14. What is the difference between a Singleton and a plain global variable?**
> A Singleton is an object with behavior and lifecycle control. A global variable is just data with no managed initialization, no access control, and no guaranteed single-construction.

---

**Q15. Why do some developers consider Singleton an anti-pattern?**
> It introduces hidden global state, makes unit testing harder (hard to swap mocks), tightly couples classes to a concrete implementation, and violates the Dependency Inversion Principle.

---

**Q16. How does NestJS implement Singleton behavior without `getInstance()`?**
> NestJS providers are Singleton-scoped by default within a module hierarchy. The IoC container creates one instance per module and injects it wherever declared — no static method needed.

---

**Q17. What is the correct scope of Singleton in a microservices system?**
> Per-process, not per-system. Each microservice container is a separate Node.js process, so "one instance" means one per container, not one across all containers.

---

**Q18. Can a Singleton ever have more than one instance?**
> Yes, in cases of: multiple class loaders (Java), multiple worker threads, multiple processes, or improper implementation without a shared static. By design it should not, but misconfiguration can cause it.

---

**Q19. How do you test code that deeply depends on a Singleton?**
> Refactor to inject the Singleton as a dependency (Dependency Inversion). Then replace with a mock or stub in tests. Never let callers call `getInstance()` directly in business logic.

---

**Q20. What is "double-checked locking" in Singleton?**
> A pattern that checks nullness twice — once without a lock and once with — to avoid synchronization overhead after the instance is already created. Relevant in multi-threaded environments.

---

**Q21. How is PrismaService a Singleton in this project?**
> Each microservice wires `PrismaService` as a NestJS provider. The IoC container creates exactly one instance that all repositories, handlers, and audit services inject and share for the lifetime of that process.

---

**Q22. What happens if two concurrent requests try to create a Singleton at the same time in Node.js?**
> Node.js is single-threaded (one event loop), so synchronous static initialization is atomic by nature. Race conditions for module-level singletons do not occur in standard Node.js code.

---

**Q23. Is `module.exports = new MyClass()` in Node.js a Singleton?**
> Effectively yes — Node.js module caching means the module is evaluated once per process, so the exported instance is shared across all `require()` calls. It is a practical Singleton.

---

**Q24. What is the difference between Singleton scope and Request scope in NestJS?**
> **Singleton scope**: one shared instance for the entire application lifetime. **Request scope**: a new instance created per incoming HTTP request. Singleton is the default and most efficient.

---

**Q25. (Tricky) How is Object Pool different from Singleton?**
> Singleton manages *one* instance. Object Pool manages *multiple* reusable instances and tracks which are in use. A pool can have N instances; a Singleton has exactly 1.

---

### Section C — Factory Method (Q 26–40)

---

**Q26. What is the Factory Method Pattern in one sentence?**
> It defines a method for creating an object but lets subclasses or specialized creators decide which concrete class to instantiate.

---

**Q27. What is the key structural difference between Factory Method and Abstract Factory?**
> Factory Method uses **inheritance** — a creator class is subclassed to override the factory method. Abstract Factory uses **composition** — a factory object is a parameter or injected dependency.

---

**Q28. Is a static `create()` method the same as the Factory Method pattern?**
> No. A static factory method is a convenience constructor. The GoF Factory Method is about *delegating creation to a subclass or polymorphic creator*, not about making constructors easier to call.

---

**Q29. Which design principle does Factory Method directly implement?**
> The **Open/Closed Principle**: you can add new product types by adding new creator subclasses without modifying existing creators or callers.

---

**Q30. Can a Factory Method return an interface type instead of a concrete class?**
> Yes, and it should. Returning an interface decouples the caller from the concrete product type entirely.

---

**Q31. What is the "concrete creator" in Factory Method terminology?**
> The class that overrides the factory method and returns a specific concrete product. In notification terms: `TweetLikedNotificationCreator` that returns `InAppStrategy`.

---

**Q32. When would you prefer Factory Method over a plain `switch` statement?**
> When the number of variants is expected to grow, when each variant has non-trivial creation logic, or when you want to test each creator independently without modifying shared code.

---

**Q33. What is the difference between a Factory Method and a Strategy Pattern?**
> Factory Method is about *object creation*. Strategy Pattern is about *swappable behavior at runtime*. Factory Method often creates Strategy objects — they are frequently used together.

---

**Q34. Can a Factory Method accept parameters?**
> Yes. Factory methods commonly accept a type identifier, config, or context parameter to decide which concrete product to create.

---

**Q35. What is the "Product" in Factory Method terminology?**
> The interface or abstract class that all created objects implement. In notification terms: `NotificationStrategy` is the Product; `InAppStrategy` and `EmailStrategy` are concrete Products.

---

**Q36. Why does Factory Method use inheritance while Abstract Factory uses composition?**
> Factory Method was designed for a single product hierarchy where you override creation per subclass. Abstract Factory creates *multiple related product hierarchies* and composition (injecting the factory) scales better for that.

---

**Q37. Is a factory function (plain function returning an object) the same as the Factory Method pattern?**
> No. A factory function is just a functional approach to creation. Factory Method pattern specifically involves a creator class with a method that subclasses override or implement polymorphically.

---

**Q38. How does Factory Method relate to Dependency Injection?**
> DI is a form of factory usage — the container plays the role of the creator, deciding which concrete class to inject. They complement each other but are not the same pattern.

---

**Q39. (Tricky) If calling code already knows the concrete type, is Factory Method needed?**
> No. Factory Method only adds value when the caller doesn't know or shouldn't know which concrete type to create, or when creation varies by runtime context.

---

**Q40. (Tricky) What happens to Factory Method if you only ever have one product type?**
> It becomes unnecessary overhead. Apply the pattern only when variation exists or is reasonably expected. Don't enforce it for a permanently single case.

---

### Section D — Abstract Factory (Q 41–50)

---

**Q41. What is the Abstract Factory Pattern in one sentence?**
> It provides an interface for creating *families* of related objects without specifying their concrete classes.

---

**Q42. What does "product family" mean in Abstract Factory?**
> A set of objects that are designed to work together. In configuration: URLs, CORS rules, and security settings that belong to the same runtime environment form one family.

---

**Q43. What problem does Abstract Factory solve that Factory Method does not?**
> Abstract Factory enforces consistency across *multiple related products* (a family). Factory Method only creates *one type of product* per creator.

---

**Q44. Can you easily add a new product type to an existing Abstract Factory?**
> No — this is the main drawback. Adding a new method to the interface (a new product type) forces *every concrete factory* to be updated. This is the Abstract Factory's extension cost.

---

**Q45. Give an example of Abstract Factory used in a real UI framework.**
> React Native's StyleSheet per platform: iOS creates one set of visual components, Android creates a different set, but both implement the same component interface — callers use identical code on both platforms.

---

**Q46. What is the "client" role in Abstract Factory?**
> The code that uses the factory without knowing or caring which concrete factory was injected. The gateway bootstrap using `factory.createUrlConfig()` is the client.

---

**Q47. What is the difference between Abstract Factory and Dependency Injection?**
> Abstract Factory creates *coherent families of objects* by choosing the right factory. DI wires pre-created dependencies into classes. Abstract Factory is a creation pattern; DI is a wiring pattern.

---

**Q48. How does Abstract Factory relate to the Liskov Substitution Principle?**
> Concrete factories must be fully substitutable for the abstract factory interface. Any concrete factory must produce objects that behave correctly with callers expecting the abstract product contracts.

---

**Q49. (Tricky) Is Abstract Factory the same as a Registry of factories?**
> No. A Registry stores and retrieves existing objects by key. Abstract Factory creates new objects through a method-based interface. A Registry of factories *could use* Abstract Factory internally, but they are different patterns.

---

**Q50. (Tricky) When would you reject Abstract Factory as a solution?**
> When there is only one environment or family, when families share 95% of their setup and vary only in two variables, or when adding new product types would be very frequent (the interface bloating cost is too high).

---

### Section E — Builder (Q 51–60)

---

**Q51. What is the Builder Pattern in one sentence?**
> It separates the step-by-step construction of a complex object from its final assembled representation.

---

**Q52. What is a "telescoping constructor" and why does Builder solve it?**
> A class with many overloaded constructors where each adds one more optional parameter. With 8 optional fields that's 256 combinations. Builder replaces all of them with clear named methods.

---

**Q53. What is method chaining and how does Builder use it?**
> Returning `this` from each builder method so calls can be chained: `.withContent(x).withMedia(y).build()`. Builder uses it to make construction readable and fluent.

---

**Q54. What is a "fluent interface" and how does it differ from regular Builder?**
> A fluent interface focuses on readability through method chaining syntax. A Builder pattern focuses on separating construction from representation. They overlap heavily — most modern Builders *are* fluent interfaces.

---

**Q55. What is the difference between Builder and Abstract Factory?**
> Builder constructs *one complex object* step by step. Abstract Factory creates *a family of related but separate objects* in one call per product type.

---

**Q56. What is the role of the `build()` method?**
> It finalizes construction, performs any required validation, and returns the completed immutable product. Nothing should be created until `build()` is called.

---

**Q57. Can Builder enforce required fields?**
> Yes — throw an error inside `build()` if mandatory fields are missing. This is cleaner than nullable constructor arguments that cause errors only at runtime.

---

**Q58. (Tricky) Is Lombok's `@Builder` annotation the Builder Pattern?**
> It is a *mechanical convenience* that generates builder code, but it does not enforce the GoF pattern's intent. GoF Builder separates construction logic into a dedicated class hierarchy. Lombok's generator skips the Director and ConcreteBuilder separation.

---

**Q59. What is the "Director" in GoF Builder terminology?**
> A class that orchestrates the builder steps in a specific order to produce a particular variant. In practice, modern code often skips the Director and lets the calling code chain methods directly.

---

**Q60. (Tricky) When should you NOT use Builder even if the object has many fields?**
> When all fields are always required (a large constructor is fine if every argument is mandatory and clearly named). Builder's value is specifically for optional, variable construction paths.

---

### Section F — Prototype (Q 61–70)

---

**Q61. What is the Prototype Pattern in one sentence?**
> It creates new objects by cloning an existing object and selectively modifying the clone, instead of constructing from scratch.

---

**Q62. What is the difference between shallow clone and deep clone?**
> **Shallow clone**: copies primitive fields by value, copies object references as-is (both original and clone point to same nested object). **Deep clone**: recursively copies all nested objects too.

---

**Q63. When would shallow cloning cause a bug in the Prototype pattern?**
> When a cloned tweet's `mediaUrls` array (a reference) is mutated — both the original and clone would see the change. Always deep-copy mutable nested structures.

---

**Q64. How does JavaScript's `prototype` chain relate to the Prototype design pattern?**
> They share a name but are different concepts. JavaScript's prototype chain is a language mechanism for property inheritance. The Prototype *design* pattern is an object-creation technique using cloning. One is a language feature; the other is a design decision.

---

**Q65. Is `Object.assign({}, source)` the same as the Prototype Pattern?**
> It performs a shallow clone, which is the mechanical part of Prototype. But the Prototype *pattern* also includes the domain meaning: the clone represents a *derived version* of the original with intentional selective overrides. `Object.assign` is just a copy tool.

---

**Q66. What is a "Prototype Registry"?**
> A store (usually a Map) that keeps named prototype instances. Callers ask the registry for a clone by name instead of holding references to originals directly. Useful when many variations of a prototype exist.

---

**Q67. Why would you use Prototype instead of Builder for retweet creation?**
> Because a retweet *IS* derived from an existing tweet. The source object already exists and provides most of the data. Builder is for construction from zero; Prototype is for derivation from something that already exists.

---

**Q68. (Tricky) When does cloning become dangerous in Prototype?**
> When the object graph is deep, circular, or contains shared mutable state. Shallow cloning circular references can cause infinite loops. Mutable shared references mean two "independent" objects accidentally affect each other.

---

**Q69. What is the difference between Prototype and a Copy Constructor?**
> A copy constructor is a language-level concept (especially in C++) that creates a copy via a special constructor. Prototype is a design pattern that emphasizes *polymorphic cloning* — calling `.clone()` without knowing the concrete class of the object being cloned.

---

**Q70. (Tricky) Can you use Prototype pattern with immutable domain entities?**
> Yes — the clone method returns a new instance with shared immutable fields and selectively replaced fields. Since immutable objects can't be mutated after construction, this is safe and idiomatic in functional-style domain models.

---

### Section G — Object Pool (Q 71–80)

---

**Q71. What is the Object Pool Pattern in one sentence?**
> It maintains a set of initialized, reusable objects that callers borrow, use, and return — avoiding repeated creation and destruction.

---

**Q72. What is the core difference between Singleton and Object Pool?**
> Singleton: exactly **1** instance, always. Object Pool: **N** instances, tracked and reused. The pool size is bounded but greater than one.

---

**Q73. What are `acquire()` and `release()` in Object Pool?**
> `acquire()` checks out a resource from the pool to the caller. `release()` returns the resource to the pool for future reuse. They are the two fundamental pool operations.

---

**Q74. What happens when a pool is exhausted (all objects in use)?**
> Options: throw an error, block/queue the caller until one is released, expand the pool if below max, or return null and let the caller handle it. The right choice depends on throughput requirements.

---

**Q75. How does Object Pool improve latency?**
> Resource creation (e.g., opening a database connection) involves network round-trips and authentication. Reusing an already-open resource skips that overhead entirely for subsequent requests.

---

**Q76. Why is Object Pool important specifically in database-backed microservices?**
> Each service handles concurrent requests, each needing a database client. Without pooling, N concurrent requests would create N connections simultaneously — exhausting the database's connection limit quickly.

---

**Q77. What does Prisma's built-in pooling do vs an application-level Object Pool?**
> Prisma's pool manages low-level TCP/socket connections to PostgreSQL. An application-level pool manages *client object leases* at the Prisma API layer — useful for observability, rate control, and resource tracking at the application level.

---

**Q78. How do you monitor an Object Pool?**
> Expose a `stats()` method returning `{ idle, active, created, peaked }`. Feed metrics to a dashboard (Prometheus, Grafana). Alert when `idle` is consistently 0 or `active` consistently equals `max`.

---

**Q79. What is "connection pool exhaustion" and what causes it?**
> All connections in the pool are checked out and none are available for new requests. Caused by: leaks (release() never called), slow queries holding connections too long, or underpowered pool size for the load.

---

**Q80. (Tricky) Can an Object Pool cause deadlocks?**
> Yes. If two tasks each hold one pooled resource and wait for the other resource to be released, you get a deadlock. Mitigations: timeouts on `acquire()`, ordering of resource acquisition, or using a single pool for all resource types.

---

### Section H — Tricky & Advanced (Q 81–90)

---

**Q81. Can Singleton violate the Single Responsibility Principle?**
> Yes. A Singleton is responsible for *its own business logic* AND for *managing its own lifecycle/instantiation*. Those are two responsibilities. Pure SRP would put instance management in a separate factory or container.

---

**Q82. What is the key difference between Factory Method and simple polymorphism?**
> Simple polymorphism: you call a method on an existing object and get different behavior. Factory Method: a creator *produces a new object* where the type of that object is decided by the creator subclass. It's polymorphism *applied to object creation*.

---

**Q83. Can Abstract Factory and Builder be used together?**
> Yes, commonly. The Abstract Factory selects which builder to use based on environment or platform. The Builder then assembles the complex product step by step. The factory chooses the construction strategy; the builder executes it.

---

**Q84. Is Dependency Injection a form of the Factory pattern?**
> Partially. A DI container acts like a factory that resolves and supplies dependencies. But DI's core concern is *wiring existing objects together*, while Factory patterns are about *creating new objects*. DI containers often use factory patterns internally.

---

**Q85. If Prisma already pools database connections, why add an application-level Object Pool?**
> To gain observability, control acquisition rate, enforce max concurrent client usage at the application layer, and make resource management explicit and auditable — Prisma's pool is a black box at the application level.

---

**Q86. How do you reset a Singleton between unit tests without refactoring?**
> Many teams expose a package-level `resetInstance()` or `__testing_reset()` method, or use dependency injection so tests inject a fresh mock instead of calling `getInstance()`. The cleanest long-term solution is always DI.

---

**Q87. What is the key difference between Builder and Prototype for creating a derived document?**
> Builder: assemble a brand-new document from zero, step by step, following a recipe. Prototype: start from an existing document, clone it, and change only what differs. Use Prototype when you have a real source object; use Builder when you don't.

---

**Q88. Why is Singleton called the "most abused" design pattern?**
> Because developers often reach for it as a shortcut for shared access instead of designing proper dependency injection. Over-use creates hidden global state, tight coupling, and untestable code.

---

**Q89. (Tricky) What is the Abstract Factory's "Open/Closed" weakness?**
> Adding a *new product type* to the abstract factory interface requires updating *every concrete factory*. It is open for adding new factories (new environments) but relatively closed against adding new product types to existing interfaces.

---

**Q90. (Tricky) Which two creational patterns together enforce both "one instance" and "controlled resource reuse" at the same time?**
> Singleton + Object Pool. The Singleton manages the pool manager itself (one pool per service), while the Object Pool manages multiple reusable resource instances within that single pool. They complement each other at different levels of the same concern.

---

> **Tip for Interviews:** When asked about any pattern, anchor your answer to three things:
> 1. The *problem* it solves.
> 2. The *structure* that solves it (one sentence).
> 3. A *concrete example* from real code or your project.
