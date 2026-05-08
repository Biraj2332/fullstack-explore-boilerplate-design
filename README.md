# Full-Stack Boilerplate

Full-Stack Boilerplate is a microservices reference project built with NestJS, React, Prisma, PostgreSQL, Docker Compose, CQRS, and Hexagonal Architecture. The system is split into seven application components: Auth Service, User Service, Tweet Service, Notification Service, Media Service, API Gateway, and React Frontend. In Docker Compose, those application components run alongside five PostgreSQL containers, which makes the full local stack twelve containers in total.

This README is intentionally educational. Its goal is not to dump code, but to explain how design patterns fit a real codebase. The strongest emphasis is on Creational Patterns, because they shape how objects, resources, and configuration are created without leaking complexity into handlers, controllers, or repositories.

## 1. Introduction

### What This Project Is

This project is a production-style boilerplate for a social platform domain. It includes:

- Auth with JWT access and refresh tokens
- User profile management
- Tweet creation, updates, likes, retweets, timeline, search, and pagination
- Notification delivery and audit logging
- Media upload and image processing
- API Gateway aggregation and proxying
- React frontend integrated with the gateway
- Docker-based local development and production overlays

### Why Design Patterns Matter Here

In a microservices project, complexity rarely comes from one giant algorithm. It comes from object creation, service wiring, configuration handling, persistence boundaries, and the repeated need to express the same ideas clearly across multiple services. Design patterns matter because they make those recurring structures explicit.

In this codebase, patterns help answer questions like these:

- How many database client instances should exist inside one service process?
- How should different notification types be created without a growing chain of conditionals?
- How should development, staging, and production configuration stay consistent without scattering `process.env` reads everywhere?
- How should a tweet with many optional attributes be created cleanly?
- How should retweets derive from an existing tweet without duplicating construction logic?

### Project Architecture Overview

At a high level, the system combines four major ideas:

- Domain-Driven Design: core business concepts live in entities, value objects, and repository interfaces.
- Hexagonal Architecture: infrastructure details sit behind ports and adapters.
- CQRS: write operations and read operations are separated into commands and queries.
- API Gateway: a single entry point routes requests to internal services.

### Runtime Topology

```text
Frontend (React)
        |
        v
API Gateway
   |    |    |    |    \
   v    v    v    v     v
 Auth  User Tweet Notif Media
   |    |    |    |     |
   v    v    v    v     v
AuthDB UserDB TweetDB NotifDB MediaDB
```

Sketch description: the browser talks to the API Gateway, which proxies requests to the internal services. Each service owns its own database. This is the key microservice boundary that makes Repository, Singleton, and configuration patterns meaningful.

## 2. Architecture Overview

### Service Layout

- `auth-service/`: authentication, token lifecycle, auth persistence
- `user-service/`: profile data, profile updates, search
- `tweet-service/`: tweets, likes, retweets, timeline, search
- `notification-service/`: notifications, audit trail, internal notification triggers
- `media-service/`: uploads, image transformation, media metadata
- `api-gateway/`: edge routing, JWT validation, rate limiting, readiness, metrics
- `frontend/`: React user interface

### Layering Style Inside Services

Most backend services already follow a recognizable internal layout:

- `domain/`: entities, value objects, repository contracts
- `application/`: commands, queries, handlers
- `infrastructure/`: Prisma adapters, guards, audit services, HTTP details
- `app.module.ts`: Nest composition root

### Current Structural Strengths

The project already uses strong architectural patterns even before the creational additions:

- Repository Pattern through interfaces like `TWEET_REPOSITORY`, `USER_REPOSITORY`, `NOTIFICATION_REPOSITORY`, and `MEDIA_REPOSITORY`
- Dependency Injection through NestJS providers and constructor injection
- CQRS through command handlers and query handlers
- API Gateway Pattern through gateway proxy modules and centralized edge concerns

## 3. Creational Patterns Deep Dive

This section is the core of the document. It focuses on creation-related design choices: how objects, strategies, configurations, and shared resources should be created in a controlled way.

### Reading Rule For This Section

There are two kinds of file references below:

- Current usage: files that already exist and expose the architectural problem or current pattern baseline
- Planned implementation location: files where the creational pattern should be introduced to keep the existing CQRS and hexagonal structure intact

---

### 3.1 Singleton Pattern

Classification: Creational Pattern

#### Real-World Analogy

Think of a control room with one master power panel for a building floor. Every technician can use the panel, but the building should not create a new master panel every time someone flips a switch. There should be one controlled instance for the shared resource.

#### Problem It Solves

Database client creation is expensive and sensitive. If a service creates too many database client instances, it can waste resources, increase connection pressure, and make lifecycle management harder. In a NestJS microservice, the practical goal is one shared Prisma client per service process.

#### Solution Structure

```text
┌──────────────────────────────────────┐
│ Repositories / Audit Services        │
│ use PrismaService through DI         │
└─────────────────┬────────────────────┘
                  │
                  v
┌──────────────────────────────────────┐
│ PrismaService (Singleton wrapper)    │
│ - static instance                    │
│ - controlled initialization          │
│ + getSharedClient()                  │
└─────────────────┬────────────────────┘
                  │
                  v
            Shared PrismaClient
```

Sketch description: many repositories depend on one shared process-local Prisma client. The service class acts as the controlled access point.

#### Components Explained

- Singleton holder: the service-local Prisma wrapper
- Shared product: the Prisma client instance
- Clients: repositories, audit services, and other infrastructure collaborators

#### Where Used In This Project

Current usage baseline:

- `auth-service/src/prisma.service.ts`
- `user-service/src/prisma.service.ts`
- `tweet-service/src/prisma.service.ts`
- `notification-service/src/prisma.service.ts`
- `media-service/src/prisma.service.ts`

These files already centralize Prisma access, but they currently express the idea as a Nest injectable service rather than as a documented, explicit Singleton.

#### Comment Reference Placement

Add the pattern comment block above each `PrismaService` class in:

- `auth-service/src/prisma.service.ts`
- `user-service/src/prisma.service.ts`
- `tweet-service/src/prisma.service.ts`
- `notification-service/src/prisma.service.ts`
- `media-service/src/prisma.service.ts`

#### Minimal Code Example

```ts
class PrismaService {
  private static instance: PrismaClient;
}
```

#### How To Verify Correctness

- One service process should create and reuse one Prisma client instance.
- Repository constructors should stay unchanged.
- Application handlers should not know or care that the client is a Singleton.

#### How It Works With CQRS + Hexagonal

Singleton belongs in the infrastructure layer. It supports repository adapters but does not affect domain contracts, command handlers, or query handlers.

---

### 3.2 Factory Method Pattern

Classification: Creational Pattern

#### Real-World Analogy

A parcel dispatch desk receives shipping requests. The clerk does not manually build every delivery workflow from scratch. Instead, the clerk chooses the correct shipping process: standard, express, refrigerated, or fragile. The desk decides which creation path to use, while the caller just says what kind of shipment is needed.

#### Problem It Solves

Notifications are not all the same. A notification for a retweet, a system alert, or a future email campaign may require different payload shaping and delivery behavior. If all of that logic sits inside handlers or controllers, the application grows brittle and hard to extend.

#### Solution Structure

```text
┌──────────────────────────────────────┐
│ SendNotificationHandler              │
└─────────────────┬────────────────────┘
                  │ asks for creator
                  v
┌──────────────────────────────────────┐
│ NotificationFactory                  │
│ + create(type or channel)            │
└───────┬───────────────┬──────────────┘
        │               │
        v               v
 InAppStrategy     EmailStrategy
                      PushStrategy
```

Sketch description: the handler delegates object creation to a factory, which selects the right concrete strategy for the requested notification kind.

#### Components Explained

- Creator: `NotificationFactory`
- Concrete creators or products: strategy classes for in-app, email, and push notifications
- Client: `SendNotificationHandler`

#### Where Used In This Project

Current baseline files showing the need:

- `notification-service/src/application/handlers/notification.handler.ts`
- `notification-service/src/infrastructure/http/notifications.controller.ts`

Planned implementation locations:

- `notification-service/src/domain/factories/notification.factory.ts`
- `notification-service/src/domain/factories/notification-channel.factory.ts`
- `notification-service/src/domain/strategies/notification-strategy.interface.ts`
- `notification-service/src/domain/strategies/in-app-notification.strategy.ts`
- `notification-service/src/domain/strategies/email-notification.strategy.ts`
- `notification-service/src/domain/strategies/push-notification.strategy.ts`

#### Comment Reference Placement

Place the main Factory Method comment above:

- `notification-service/src/domain/factories/notification.factory.ts`

Add supporting pattern comments above:

- `notification-service/src/domain/strategies/notification-strategy.interface.ts`
- one or two concrete strategy classes

Add one short inline comment in:

- `notification-service/src/application/handlers/notification.handler.ts`

#### Minimal Code Example

```ts
const strategy = factory.create(channel);
```

#### How To Verify Correctness

- The handler should no longer assemble every notification variant directly.
- Adding a new channel should be localized to factory and strategy classes.
- Controllers should stay thin.

#### How It Works With CQRS + Hexagonal

The factory sits at the domain/application seam. The command handler remains the orchestrator. The repository still persists the final notification entity.

---

### 3.3 Abstract Factory Pattern

Classification: Creational Pattern

#### Real-World Analogy

A hotel chain does not furnish each branch room by room with random choices. Instead, it chooses a package for each category: budget, business, or luxury. Each package includes a matching set of furniture, lighting, and service rules. The customer sees a coherent environment, not a bag of unrelated choices.

#### Problem It Solves

Direct `process.env` reads are scattered through the gateway and services. That works at small scale, but it becomes harder to reason about grouped runtime behavior such as service URLs, CORS rules, security defaults, logging mode, or feature flags for different environments.

#### Solution Structure

```text
┌──────────────────────────────────────┐
│ ConfigFactoryResolver                │
│ NODE_ENV decides concrete factory    │
└───────┬────────────────┬─────────────┘
        │                │
        v                v
 DevConfigFactory   ProdConfigFactory
        │                │
        v                v
 URLs, CORS,       URLs, CORS,
 Logging, Security Logging, Security
```

Sketch description: one chosen factory returns a related family of environment-specific settings, rather than having unrelated `process.env` lookups spread across the codebase.

#### Components Explained

- Abstract factory: environment config contract
- Concrete factories: dev, staging, prod factories
- Product family: related configuration objects such as URLs, CORS, security, and logging options
- Client: gateway bootstrap and service-level runtime collaborators

#### Where Used In This Project

Current baseline files showing the need:

- `api-gateway/src/main.ts`
- `api-gateway/src/app.service.ts`
- `tweet-service/src/application/handlers/tweet-crud.handler.ts`
- `tweet-service/src/application/handlers/tweet-social.handler.ts`

Planned implementation locations:

- `api-gateway/src/config/environment-config.interface.ts`
- `api-gateway/src/config/config.factory.ts`
- `api-gateway/src/config/dev-config.factory.ts`
- `api-gateway/src/config/staging-config.factory.ts`
- `api-gateway/src/config/prod-config.factory.ts`
- `tweet-service/src/config/environment-config.interface.ts`
- `tweet-service/src/config/config.factory.ts`

#### Comment Reference Placement

Place the main pattern comment above:

- `api-gateway/src/config/config.factory.ts`

Add supporting comments above one concrete factory, for example:

- `api-gateway/src/config/prod-config.factory.ts`

#### Minimal Code Example

```ts
const config = resolver.resolve(process.env.NODE_ENV);
```

#### How To Verify Correctness

- Repeated `process.env` access should shrink in bootstrap and handler files.
- Environment behavior should become easier to reason about as a grouped unit.
- Dev, staging, and production should differ by factory, not by scattered conditionals.

#### How It Works With CQRS + Hexagonal

Abstract Factory is an infrastructure/configuration concern. It supplies environment-aware collaborators to application code without polluting domain logic.

---

### 3.4 Builder Pattern

Classification: Creational Pattern

#### Real-World Analogy

Ordering a custom sandwich is easier through step-by-step assembly than by shouting one giant constructor of ingredients at the counter. Bread, protein, toppings, sauces, and extras are chosen in sequence until the sandwich is ready.

#### Problem It Solves

Tweet creation starts simple, but it naturally grows optional parts: media, mentions, hashtags, location, quoted content, retweet references, and derived metadata. Large constructors make this hard to read and harder to evolve.

#### Solution Structure

```text
┌──────────────────────────────────────┐
│ TweetBuilder                         │
│ .withUserId()                        │
│ .withContent()                       │
│ .withMediaUrls()                     │
│ .withOriginalTweetId()               │
│ .build()                             │
└─────────────────┬────────────────────┘
                  │
                  v
                Tweet
```

Sketch description: the builder lets the application assemble a tweet piece by piece, which keeps creation readable even when optional fields grow.

#### Components Explained

- Builder: `TweetBuilder`
- Product: `Tweet`
- Client: tweet command handler or repository entity mapper

#### Where Used In This Project

Current baseline files showing the need:

- `tweet-service/src/domain/entities/tweet.entity.ts`
- `tweet-service/src/application/handlers/tweet-crud.handler.ts`
- `tweet-service/src/infrastructure/persistence/prisma-tweet.repository.ts`

Planned implementation location:

- `tweet-service/src/domain/builders/tweet.builder.ts`

#### Comment Reference Placement

Place the main Builder comment above:

- `tweet-service/src/domain/builders/tweet.builder.ts`

Add one short supporting comment near builder usage in:

- `tweet-service/src/application/handlers/tweet-crud.handler.ts`
- `tweet-service/src/infrastructure/persistence/prisma-tweet.repository.ts`

#### Minimal Code Example

```ts
const tweet = builder.withContent(text).withMediaUrls(urls).build();
```

#### How To Verify Correctness

- Long `new Tweet(...)` construction paths should become easier to read.
- Adding an optional tweet field should not force constructor churn across multiple files.
- The builder should not replace validation; it should organize construction.

#### How It Works With CQRS + Hexagonal

Builder belongs in the domain or domain-adjacent construction layer. Command handlers use it to express intent clearly before repository persistence.

---

### 3.5 Prototype Pattern

Classification: Creational Pattern

#### Real-World Analogy

An architect duplicates an existing floor plan as a template, then changes only the rooms that differ. The new plan inherits the structure of the old one without redrawing everything from scratch.

#### Problem It Solves

Retweets are derived from an existing tweet. They are not unrelated creations. If retweet logic manually reconstructs everything each time, the derivation rule becomes fragile and duplicated.

#### Solution Structure

```text
┌──────────────────────────────────────┐
│ Original Tweet                       │
└─────────────────┬────────────────────┘
                  │ cloneForRetweet(...)
                  v
┌──────────────────────────────────────┐
│ Retweet Draft                        │
│ copied structure + selective changes │
└──────────────────────────────────────┘
```

Sketch description: a retweet starts from an original tweet and overrides selected values such as owner, comment, and original-tweet link.

#### Components Explained

- Prototype: original tweet entity
- Clone operation: retweet-oriented clone method
- Client: retweet command handler

#### Where Used In This Project

Current baseline files showing the need:

- `tweet-service/src/domain/entities/tweet.entity.ts`
- `tweet-service/src/application/handlers/tweet-social.handler.ts`

Planned implementation locations:

- `tweet-service/src/domain/entities/tweet.entity.ts`
- optionally `tweet-service/src/domain/prototypes/tweet.prototype.ts`

#### Comment Reference Placement

Place the main pattern comment above the clone method or prototype helper in:

- `tweet-service/src/domain/entities/tweet.entity.ts`

Add one short supporting comment in:

- `tweet-service/src/application/handlers/tweet-social.handler.ts`

#### Minimal Code Example

```ts
const retweetDraft = original.cloneForRetweet(userId, comment);
```

#### How To Verify Correctness

- The retweet path should start from an existing tweet object.
- Clone rules should be centralized.
- The retweet handler should become easier to read.

#### How It Works With CQRS + Hexagonal

Prototype belongs near the domain entity because it describes how one business object can derive another. The command handler invokes the behavior; the repository persists the result.

---

### 3.6 Object Pool Pattern

Classification: Creational Pattern

#### Real-World Analogy

At a high-end workshop, specialized tools are checked out from a tool station and returned after use. Craftsmen do not buy a new torque wrench every time they need one. The station tracks what is in use, what is idle, and when a tool can be reused.

#### Problem It Solves

Shared resource creation should be controlled and observable. In pure theory, database resources are a classic case for object pooling. In this codebase, Prisma already performs real database pooling internally, so the best educational implementation is a logical pool manager around client access rather than a replacement for Prisma internals.

#### Solution Structure

```text
┌──────────────────────────────────────┐
│ PrismaClientPool                     │
│ idle: n  active: m                   │
└──────────────┬───────────────┬───────┘
               │               │
               v               v
          acquire()        release()
               │               │
               └──── client ───┘
```

Sketch description: callers lease a reusable client resource from a pool and return it after use. The pool tracks active versus idle resources.

#### Components Explained

- Pool manager: `PrismaClientPool`
- Pooled resource: Prisma client or client lease wrapper
- Client: Prisma service or repository adapter

#### Where Used In This Project

Current baseline files showing the connection-management boundary:

- `auth-service/src/prisma.service.ts`
- `user-service/src/prisma.service.ts`
- `tweet-service/src/prisma.service.ts`
- `notification-service/src/prisma.service.ts`
- `media-service/src/prisma.service.ts`

Planned implementation locations:

- `auth-service/src/infrastructure/persistence/prisma-client.pool.ts`
- `user-service/src/infrastructure/persistence/prisma-client.pool.ts`
- `tweet-service/src/infrastructure/persistence/prisma-client.pool.ts`
- `notification-service/src/infrastructure/persistence/prisma-client.pool.ts`
- `media-service/src/infrastructure/persistence/prisma-client.pool.ts`

#### Comment Reference Placement

Place the main pattern comment above:

- each `prisma-client.pool.ts`

Add one short supporting comment in:

- each `prisma.service.ts`

#### Minimal Code Example

```ts
const lease = pool.acquire();
pool.release(lease);
```

#### How To Verify Correctness

- The pool should expose observable state such as idle and active counts.
- The README and code comments should explicitly state that Prisma still owns the real low-level DB pooling.
- The application should treat the pool as an educational resource-management layer.

#### How It Works With CQRS + Hexagonal

Object Pool is an infrastructure detail. It should support repository access without changing domain or handler semantics.

## 4. Other Patterns Already In The Project

This codebase is not starting from zero. Several major patterns already exist and form the architectural backbone.

### Repository Pattern

Repository interfaces already abstract persistence from domain and application logic.

Examples:

- `tweet-service/src/domain/repositories/tweet.repository.interface.ts`
- `user-service/src/domain/repositories/user.repository.interface.ts`
- `notification-service/src/domain/repositories/notification.repository.interface.ts`
- `media-service/src/domain/repositories/media.repository.interface.ts`

Their Prisma-based implementations live in infrastructure folders, which keeps persistence concerns outside the domain.

### Dependency Injection

NestJS already provides dependency injection throughout the services. Providers are wired in module files such as:

- `tweet-service/src/app.module.ts`
- `notification-service/src/app.module.ts`
- `media-service/src/app.module.ts`
- `api-gateway/src/app.module.ts`

DI is what makes the creational patterns practical here. Singleton, Factory Method, and Abstract Factory all become easier to use because collaborators can be injected cleanly.

### CQRS Pattern

The codebase already separates command-side behavior from query-side behavior.

Examples:

- `tweet-service/src/application/handlers/tweet-crud.handler.ts`
- `tweet-service/src/application/handlers/tweet-social.handler.ts`
- `tweet-service/src/application/handlers/tweet-query.handler.ts`
- `notification-service/src/application/handlers/notification.handler.ts`
- `notification-service/src/application/handlers/notification-query.handler.ts`
- `media-service/src/application/handlers/upload-media.handler.ts`
- `media-service/src/application/handlers/media-query.handler.ts`

This separation is important because creational patterns should assist object creation and resource management without collapsing the clean read/write boundary.

### API Gateway Pattern

The gateway serves as the public entry point and centralizes edge concerns like routing, rate limiting, health checks, metrics, CORS, and request identity.

Examples:

- `api-gateway/src/app.module.ts`
- `api-gateway/src/main.ts`
- `api-gateway/src/app.service.ts`
- `api-gateway/src/auth-proxy/`
- `api-gateway/src/users-proxy/`
- `api-gateway/src/tweets-proxy/`
- `api-gateway/src/notifications-proxy/`
- `api-gateway/src/media-proxy/`

## 5. How To Read This Codebase

### Navigation Guide

If you are new to the project, read in this order:

1. Start with `docker-compose.yml` to understand the system boundary and service list.
2. Read `api-gateway/` to understand public entry flow.
3. Open one service end-to-end, preferably `tweet-service/`.
4. Within a service, read `app.module.ts` first.
5. Then read `domain/`, `application/`, and `infrastructure/` in that order.
6. Finally inspect the frontend for integration behavior.

### Pattern Comment Format

All pattern comments should use the same format:

```text
PATTERN
Purpose
Problem
How it works here
Related files
```

This format is intentionally repetitive. It makes the codebase readable as a teaching artifact, not just as runnable software.

### Service Structure Explanation

Use this mental model when reading any backend service:

```text
HTTP request
  -> controller or guard
  -> command bus or query bus
  -> handler
  -> repository interface
  -> Prisma adapter
  -> database
```

Creational patterns should be inserted where creation decisions belong:

- Singleton and Object Pool in infrastructure
- Factory Method near application and domain creation logic
- Abstract Factory in bootstrap/configuration
- Builder and Prototype near domain construction

### Best First Service To Study

`tweet-service/` is the best educational starting point because it already exposes:

- repository abstraction
- CQRS handlers
- value object validation
- retweet flow
- search and pagination

That makes it the best place to understand Builder and Prototype in context.

## 6. Running The Project

### Development

```bash
docker compose up -d --build
```

### Production Overlay

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml --env-file .env.production up -d
```

### Shutdown

```bash
docker compose down
```

### Database Backups

```bash
./scripts/backup-databases.sh
```

### Environment Files

- `.env.development`
- `.env.production`

## 7. Pattern Implementation Checklist

- [ ] Singleton - PrismaClient instance
- [ ] Factory Method - NotificationFactory
- [ ] Abstract Factory - ConfigFactory for environments
- [ ] Builder - TweetBuilder
- [ ] Prototype - Tweet clone for retweet
- [ ] Object Pool - ConnectionPool manager

### Code Comment Verification Checklist

- [ ] Every pattern implementation has a pattern comment block
- [ ] Every comment explains purpose, problem, operation, and related files
- [ ] Main comment block is placed above the primary pattern class or method
- [ ] At least one collaboration point contains a short supporting inline comment
- [ ] Comments do not replace code clarity; they explain architecture, not trivia

### 8. References And Further Learning

### Books

- Eric Evans, _Domain-Driven Design_
- Martin Fowler, _Patterns of Enterprise Application Architecture_
- Robert C. Martin, _Clean Architecture_
- Gamma, Helm, Johnson, Vlissides, _Design Patterns: Elements of Reusable Object-Oriented Software_

### Articles And Documentation

- NestJS official docs on providers, modules, and CQRS
- Prisma docs on Prisma Client lifecycle and connection management
- Refactoring.Guru pattern catalog for clear pattern definitions and structure diagrams

### Video And Study Topics

- CQRS in NestJS
- Hexagonal Architecture with Ports and Adapters
- Microservice configuration management
- Object creation patterns in TypeScript

### Practical Study Advice

Do not study the patterns in isolation. Read them against real files in this repository. The real learning value comes from seeing where a pattern belongs, where it does not belong, and how it coexists with existing architectural boundaries.

## 10. Final Reading Summary

This codebase already demonstrates strong architectural discipline through Repository, Dependency Injection, CQRS, and API Gateway patterns. The creational patterns described in this README are not meant to replace that structure. They are meant to sharpen object creation, resource sharing, environment configuration, and derivation behavior in places where the project naturally needs them.

If you read the code with that lens, the project becomes easier to understand:

- repositories explain persistence boundaries
- handlers explain use-case flow
- gateways explain system entry
- creational patterns explain controlled construction

That combination is what turns a codebase from merely functional into teachable.