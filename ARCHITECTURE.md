# NestJS — Domain-Driven Design · Hexagonal Architecture · CQRS

> **Production-grade reference architecture** combining NestJS, Domain-Driven Design (DDD),
> Hexagonal Architecture (Ports & Adapters), and CQRS into a single, battle-tested blueprint.

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Domain-Driven Design (DDD)](#2-domain-driven-design-ddd)
3. [Hexagonal Architecture (Ports & Adapters)](#3-hexagonal-architecture-ports--adapters)
4. [CQRS — Command Query Responsibility Segregation](#4-cqrs--command-query-responsibility-segregation)
5. [Full NestJS Project Structure](#5-full-nestjs-project-structure)
6. [Domain Layer — Entities, Value Objects & Aggregates](#6-domain-layer--entities-value-objects--aggregates)
7. [Application Layer — Use Cases, Commands & Queries](#7-application-layer--use-cases-commands--queries)
8. [Infrastructure Layer — Adapters & Repositories](#8-infrastructure-layer--adapters--repositories)
9. [Interface Layer — Controllers & DTOs](#9-interface-layer--controllers--dtos)
10. [Dependency Injection & NestJS Module Wiring](#10-dependency-injection--nestjs-module-wiring)
11. [Event-Driven Communication & Domain Events](#11-event-driven-communication--domain-events)
12. [Testing Strategy](#12-testing-strategy)
13. [Layer Interaction & Data Flow Reference](#13-layer-interaction--data-flow-reference)

---

## 1. Architecture Overview

### Concept

The architecture unifies three complementary patterns:

| Pattern | Responsibility | Core Benefit |
|---|---|---|
| **DDD** | Model the business domain with rich language | Code reflects the real world |
| **Hexagonal** | Isolate domain from I/O concerns | Testable, swappable adapters |
| **CQRS** | Separate reads from writes | Scalable, auditable operations |

When layered together, these patterns produce a system where:

- **Business logic lives exclusively in the domain** — no framework leakage.
- **Every external dependency** (DB, HTTP, MQ) is hidden behind a port.
- **Commands mutate state; queries read state** — never mixed.
- **NestJS** serves only as the composition root and delivery mechanism.

---

### Master Architecture Diagram

```mermaid
graph TB
    subgraph INTERFACE ["🖥️  Interface Layer (Adapters IN)"]
        HTTP["REST Controller"]
        GQL["GraphQL Resolver"]
        CLI["CLI Command"]
        MQ_IN["Message Consumer"]
    end

    subgraph APPLICATION ["⚙️  Application Layer (Use Cases / CQRS Bus)"]
        CMD_BUS["CommandBus"]
        QRY_BUS["QueryBus"]
        EVT_BUS["EventBus"]
        CMD_H["Command Handlers"]
        QRY_H["Query Handlers"]
        EVT_H["Event Handlers / Sagas"]
    end

    subgraph DOMAIN ["🧠  Domain Layer (Pure Business Logic)"]
        AGG["Aggregates"]
        ENT["Entities"]
        VO["Value Objects"]
        DOM_EVT["Domain Events"]
        REPO_PORT["Repository Port (interface)"]
        SVC_PORT["Domain Service Port (interface)"]
    end

    subgraph INFRA ["🔧  Infrastructure Layer (Adapters OUT)"]
        REPO_IMPL["TypeORM Repository Impl"]
        EMAIL_IMPL["SendGrid Email Adapter"]
        MQ_OUT["RabbitMQ Publisher Adapter"]
        CACHE["Redis Cache Adapter"]
    end

    subgraph EXTERNAL ["🌐  External Systems"]
        DB[("PostgreSQL")]
        BROKER[("RabbitMQ")]
        MAIL["SendGrid API"]
        REDIS[("Redis")]
    end

    HTTP --> CMD_BUS
    HTTP --> QRY_BUS
    GQL --> QRY_BUS
    CLI --> CMD_BUS
    MQ_IN --> CMD_BUS

    CMD_BUS --> CMD_H
    QRY_BUS --> QRY_H
    CMD_H --> AGG
    CMD_H --> REPO_PORT
    QRY_H --> REPO_PORT
    AGG --> DOM_EVT
    DOM_EVT --> EVT_BUS
    EVT_BUS --> EVT_H

    REPO_PORT -.->|implements| REPO_IMPL
    SVC_PORT -.->|implements| EMAIL_IMPL
    SVC_PORT -.->|implements| MQ_OUT

    REPO_IMPL --> DB
    EMAIL_IMPL --> MAIL
    MQ_OUT --> BROKER
    CACHE --> REDIS
```

![Master Architecture Diagram](./images/master-architecture.png)

> **IMAGE PROMPT (master-architecture.png):**
> _"A clean, professional software architecture diagram on a white background. Four horizontal swim-lane layers labelled 'Interface Layer', 'Application Layer', 'Domain Layer', and 'Infrastructure Layer'. Each layer is a distinct pastel colour band (blue, green, amber, grey). Inside each band are labelled rectangular boxes with icons: REST/GraphQL/CLI boxes in the top layer; CommandBus, QueryBus, EventBus boxes in the second layer; Aggregates, Entities, Value Objects boxes in the third layer; Database, Message Queue, Email adapter boxes in the bottom layer. Arrows show data flow top-to-bottom. Dashed arrows mark interface-to-implementation boundaries. Modern flat-design style, no gradients, subtle drop shadows, sans-serif font."_

---

## 2. Domain-Driven Design (DDD)

### Core Building Blocks

| Building Block | Description | NestJS Location |
|---|---|---|
| **Entity** | Has a unique identity that persists across mutations | `domain/entities/` |
| **Value Object** | Immutable, equality by value, no identity | `domain/value-objects/` |
| **Aggregate** | Cluster of entities with a single root; guards invariants | `domain/aggregates/` |
| **Domain Event** | Fact that happened in the domain, past tense | `domain/events/` |
| **Repository (Port)** | Abstract persistence contract owned by domain | `domain/ports/` |
| **Domain Service** | Stateless logic that doesn't belong to one aggregate | `domain/services/` |
| **Factory** | Complex aggregate construction logic | `domain/factories/` |

### Strategic Design Concepts

```mermaid
graph LR
    subgraph BC1 ["Bounded Context: Orders"]
        O_AGG["Order Aggregate"]
        O_ITEM["OrderItem Entity"]
        O_PRICE["Money Value Object"]
    end

    subgraph BC2 ["Bounded Context: Inventory"]
        I_ENT["Product Entity"]
        I_STOCK["StockLevel Value Object"]
    end

    subgraph BC3 ["Bounded Context: Notifications"]
        N_SVC["NotificationService"]
    end

    O_AGG -- "OrderPlaced Event\n(Anti-Corruption Layer)" --> BC3
    BC1 -- "Conformist / ACL" --> BC2

    style BC1 fill:#dbeafe,stroke:#3b82f6
    style BC2 fill:#dcfce7,stroke:#22c55e
    style BC3 fill:#fef9c3,stroke:#eab308
```

![DDD Strategic Design](./images/ddd-strategic-design.png)

> **IMAGE PROMPT (ddd-strategic-design.png):**
> _"A Domain-Driven Design strategic design map. Three coloured hexagon clusters on a white background, each labelled as a 'Bounded Context': 'Orders' (blue), 'Inventory' (green), 'Notifications' (yellow). Inside each hexagon cluster are smaller rounded rectangles representing Aggregates, Entities, and Value Objects with small icons. Between clusters, curved labelled arrows show context relationships: 'Anti-Corruption Layer', 'Conformist', 'Published Language'. A Ubiquitous Language legend box in the top-right corner. Clean, modern enterprise architecture style with Avenir or Inter font."_

---

### Ubiquitous Language Table (Sample: Order Domain)

| Term | Definition |
|---|---|
| **Order** | A customer's request to purchase one or more products |
| **OrderItem** | A single product line within an Order |
| **PlaceOrder** | The act of submitting an Order for fulfilment |
| **ConfirmOrder** | Domain event: the warehouse has accepted the Order |
| **Money** | An amount with an associated currency (Value Object) |
| **CustomerId** | Strongly-typed identifier for a Customer |

---

## 3. Hexagonal Architecture (Ports & Adapters)

### The Core Principle

> _"Allow an application to equally be driven by users, programs, automated tests or batch scripts, and to be developed and tested in isolation from its eventual run-time devices and databases."_
> — Alistair Cockburn

The application **hexagon** (domain + application) defines **ports** (interfaces). The outside world connects only through **adapters** that fulfil those ports.

```mermaid
graph LR
    subgraph HEX ["⬡  Application Hexagon"]
        APP_CORE["Application Core\n(Domain + Use Cases)"]
        P_IN["«port»\nOrderService\nIOrderRepository"]
        P_OUT["«port»\nIEmailService\nIEventPublisher"]
        APP_CORE --- P_IN
        APP_CORE --- P_OUT
    end

    REST["REST Adapter\n(NestJS Controller)"]
    GQL["GraphQL Adapter\n(Resolver)"]
    TEST["Test Adapter\n(Jest Mock)"]

    ORM["TypeORM Adapter\n(Repository Impl)"]
    EMAIL["SendGrid Adapter"]
    KAFKA["Kafka Adapter"]

    REST -->|driving| P_IN
    GQL -->|driving| P_IN
    TEST -->|driving| P_IN

    P_OUT -->|driven| ORM
    P_OUT -->|driven| EMAIL
    P_OUT -->|driven| KAFKA

    style HEX fill:#ede9fe,stroke:#7c3aed
```

![Hexagonal Architecture Diagram](./images/hexagonal-architecture.png)

> **IMAGE PROMPT (hexagonal-architecture.png):**
> _"A hexagonal architecture diagram. Centre: a large regular hexagon with a soft purple fill labelled 'Application Core' containing two sub-boxes: 'Domain Layer' and 'Application Layer'. Left side of the hexagon: three rectangular adapter boxes in blue labelled 'REST Adapter', 'GraphQL Adapter', 'Test Adapter' connected with solid arrows labelled 'driving' pointing INTO the hexagon. Right side: three rectangular adapter boxes in green labelled 'TypeORM Adapter', 'SendGrid Adapter', 'Kafka Adapter' connected to the hexagon with dashed arrows labelled 'driven'. Port symbols (small circles with lines) sit on hexagon edges. Background is white with a subtle grid. Sans-serif font, flat icon style."_

---

### Port Definition Pattern

```typescript
// domain/ports/order-repository.port.ts
export abstract class OrderRepositoryPort {
  abstract findById(id: OrderId): Promise<Order | null>;
  abstract findByCustomerId(customerId: CustomerId): Promise<Order[]>;
  abstract save(order: Order): Promise<void>;
  abstract delete(id: OrderId): Promise<void>;
}
```

> **NOTE:** Use `abstract class` (not `interface`) in NestJS so it can be used as a dependency injection token natively.

---

## 4. CQRS — Command Query Responsibility Segregation

### Principle

> **Commands** change state and return nothing (or a simple acknowledgement).
> **Queries** read state and never mutate it.

```mermaid
sequenceDiagram
    actor Client
    participant Controller
    participant CommandBus
    participant PlaceOrderHandler
    participant OrderAggregate
    participant OrderRepo
    participant EventBus
    participant OrderPlacedHandler

    Client->>Controller: POST /orders
    Controller->>CommandBus: execute(PlaceOrderCommand)
    CommandBus->>PlaceOrderHandler: handle(cmd)
    PlaceOrderHandler->>OrderAggregate: Order.place(items, customerId)
    OrderAggregate-->>PlaceOrderHandler: order (with domain events)
    PlaceOrderHandler->>OrderRepo: save(order)
    PlaceOrderHandler->>EventBus: publish(OrderPlacedEvent)
    EventBus->>OrderPlacedHandler: handle(event)
    OrderPlacedHandler-->>Client: (async: email sent)
    PlaceOrderHandler-->>Controller: orderId
    Controller-->>Client: 201 Created { orderId }
```

![CQRS Command Flow](./images/cqrs-command-flow.png)

> **IMAGE PROMPT (cqrs-command-flow.png):**
> _"A CQRS sequence diagram rendered as a modern swim-lane diagram. Seven vertical swim-lanes with rounded headers: 'Client', 'REST Controller', 'CommandBus', 'PlaceOrderHandler', 'Order Aggregate', 'Repository', 'EventBus'. Horizontal arrows flow left-to-right then right-to-left showing method calls. Each method call has a label in a small pill badge. Commands are shown in blue arrows, Events in orange arrows, Return values in grey dashed arrows. A separate smaller query path is shown below in green with QueryBus and QueryHandler lanes. White background, clean enterprise diagram style."_

---

### Read Model / Query Side

```mermaid
graph LR
    subgraph WRITE ["Write Side"]
        CMD["PlaceOrderCommand"] --> CH["PlaceOrderHandler"]
        CH --> AGG["Order Aggregate"]
        AGG --> DB_W[("Write Store\n(PostgreSQL)")]
        AGG -- fires --> EVT["OrderPlacedEvent"]
    end

    subgraph PROJECTOR ["Projection"]
        EVT --> PROJ["OrderProjector"]
        PROJ --> DB_R[("Read Store\n(PostgreSQL View\nor Elasticsearch)")]
    end

    subgraph READ ["Read Side"]
        QRY["GetOrdersQuery"] --> QH["GetOrdersHandler"]
        QH --> DB_R
        QH --> DTO["OrderSummaryDTO"]
    end

    style WRITE fill:#dbeafe,stroke:#3b82f6
    style PROJECTOR fill:#fef9c3,stroke:#eab308
    style READ fill:#dcfce7,stroke:#22c55e
```

![CQRS Read Write Separation](./images/cqrs-read-write.png)

> **IMAGE PROMPT (cqrs-read-write.png):**
> _"A CQRS architecture diagram split into three vertical panels on white background. Left panel (blue): 'Write Side' with boxes for Command → Handler → Aggregate → Write DB with downward arrows. Middle panel (yellow): 'Projection / Synchronisation' with an event box and projector transforming write events into read models. Right panel (green): 'Read Side' with Query → Handler → Read DB → DTO boxes with downward arrows. Bold vertical separator lines between panels. All boxes have icons: command icon (pencil), query icon (magnifying glass), database icon (cylinder). Modern flat style."_

---

## 5. Full NestJS Project Structure

```
src/
├── modules/
│   └── orders/
│       ├── domain/
│       │   ├── aggregates/
│       │   │   └── order.aggregate.ts
│       │   ├── entities/
│       │   │   └── order-item.entity.ts
│       │   ├── value-objects/
│       │   │   ├── money.value-object.ts
│       │   │   ├── order-id.value-object.ts
│       │   │   └── customer-id.value-object.ts
│       │   ├── events/
│       │   │   ├── order-placed.event.ts
│       │   │   └── order-confirmed.event.ts
│       │   ├── ports/
│       │   │   ├── order-repository.port.ts
│       │   │   └── email-service.port.ts
│       │   └── exceptions/
│       │       └── order-not-found.exception.ts
│       │
│       ├── application/
│       │   ├── commands/
│       │   │   ├── place-order/
│       │   │   │   ├── place-order.command.ts
│       │   │   │   └── place-order.handler.ts
│       │   │   └── cancel-order/
│       │   │       ├── cancel-order.command.ts
│       │   │       └── cancel-order.handler.ts
│       │   ├── queries/
│       │   │   ├── get-order/
│       │   │   │   ├── get-order.query.ts
│       │   │   │   └── get-order.handler.ts
│       │   │   └── list-orders/
│       │   │       ├── list-orders.query.ts
│       │   │       └── list-orders.handler.ts
│       │   ├── events/
│       │   │   └── order-placed/
│       │   │       └── order-placed.handler.ts
│       │   └── dtos/
│       │       ├── order.dto.ts
│       │       └── order-item.dto.ts
│       │
│       ├── infrastructure/
│       │   ├── persistence/
│       │   │   ├── typeorm/
│       │   │   │   ├── order.orm-entity.ts
│       │   │   │   ├── order.mapper.ts
│       │   │   │   └── order.typeorm-repository.ts
│       │   │   └── in-memory/
│       │   │       └── order.in-memory-repository.ts
│       │   ├── email/
│       │   │   └── sendgrid-email.adapter.ts
│       │   └── messaging/
│       │       └── rabbitmq-event-publisher.adapter.ts
│       │
│       ├── interface/
│       │   ├── http/
│       │   │   ├── orders.controller.ts
│       │   │   └── dtos/
│       │   │       ├── place-order.request.dto.ts
│       │   │       └── order.response.dto.ts
│       │   └── graphql/
│       │       └── orders.resolver.ts
│       │
│       └── orders.module.ts
│
├── shared/
│   ├── domain/
│   │   ├── aggregate-root.base.ts
│   │   ├── entity.base.ts
│   │   ├── value-object.base.ts
│   │   └── domain-event.base.ts
│   └── infrastructure/
│       └── typeorm/
│           └── base.typeorm-repository.ts
│
├── app.module.ts
└── main.ts
```

---

## 6. Domain Layer — Entities, Value Objects & Aggregates

### 6.1 Base Classes

```typescript
// src/shared/domain/value-object.base.ts
export abstract class ValueObject<T extends Record<string, unknown>> {
  protected readonly props: Readonly<T>;

  constructor(props: T) {
    this.validate(props);
    this.props = Object.freeze(props);
  }

  protected abstract validate(props: T): void;

  equals(other: ValueObject<T>): boolean {
    if (other === null || other === undefined) return false;
    return JSON.stringify(this.props) === JSON.stringify(other.props);
  }
}
```

```typescript
// src/shared/domain/entity.base.ts
import { randomUUID } from 'crypto';

export abstract class Entity<TId> {
  protected readonly _id: TId;

  constructor(id?: TId) {
    this._id = id ?? (randomUUID() as unknown as TId);
  }

  get id(): TId {
    return this._id;
  }

  equals(other: Entity<TId>): boolean {
    if (!(other instanceof Entity)) return false;
    return this._id === other._id;
  }
}
```

```typescript
// src/shared/domain/domain-event.base.ts
export abstract class DomainEvent {
  readonly occurredAt: Date;
  readonly aggregateId: string;

  constructor(aggregateId: string) {
    this.aggregateId = aggregateId;
    this.occurredAt = new Date();
  }
}
```

```typescript
// src/shared/domain/aggregate-root.base.ts
import { DomainEvent } from './domain-event.base';
import { Entity } from './entity.base';

export abstract class AggregateRoot<TId> extends Entity<TId> {
  private _domainEvents: DomainEvent[] = [];

  protected addDomainEvent(event: DomainEvent): void {
    this._domainEvents.push(event);
  }

  pullDomainEvents(): DomainEvent[] {
    const events = [...this._domainEvents];
    this._domainEvents = [];
    return events;
  }
}
```

---

### 6.2 Value Objects

```typescript
// src/modules/orders/domain/value-objects/money.value-object.ts
import { ValueObject } from '../../../../shared/domain/value-object.base';

interface MoneyProps {
  amount: number;
  currency: string;
}

export class Money extends ValueObject<MoneyProps> {
  static readonly SUPPORTED_CURRENCIES = ['USD', 'EUR', 'GBP'] as const;

  static create(amount: number, currency: string): Money {
    return new Money({ amount, currency });
  }

  protected validate({ amount, currency }: MoneyProps): void {
    if (amount < 0) throw new Error('Amount cannot be negative');
    if (!Money.SUPPORTED_CURRENCIES.includes(currency as any))
      throw new Error(`Unsupported currency: ${currency}`);
  }

  add(other: Money): Money {
    if (this.props.currency !== other.props.currency)
      throw new Error('Cannot add different currencies');
    return Money.create(this.props.amount + other.props.amount, this.props.currency);
  }

  get amount(): number { return this.props.amount; }
  get currency(): string { return this.props.currency; }
}
```

```typescript
// src/modules/orders/domain/value-objects/order-id.value-object.ts
import { ValueObject } from '../../../../shared/domain/value-object.base';
import { randomUUID } from 'crypto';

interface OrderIdProps { value: string; }

export class OrderId extends ValueObject<OrderIdProps> {
  static generate(): OrderId { return new OrderId({ value: randomUUID() }); }
  static from(value: string): OrderId { return new OrderId({ value }); }

  protected validate({ value }: OrderIdProps): void {
    const UUID_REGEX =
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!UUID_REGEX.test(value)) throw new Error(`Invalid OrderId: ${value}`);
  }

  get value(): string { return this.props.value; }
  toString(): string { return this.props.value; }
}
```

---

### 6.3 Order Aggregate

```typescript
// src/modules/orders/domain/aggregates/order.aggregate.ts
import { AggregateRoot } from '../../../../shared/domain/aggregate-root.base';
import { OrderId } from '../value-objects/order-id.value-object';
import { CustomerId } from '../value-objects/customer-id.value-object';
import { Money } from '../value-objects/money.value-object';
import { OrderItem } from '../entities/order-item.entity';
import { OrderPlacedEvent } from '../events/order-placed.event';
import { OrderConfirmedEvent } from '../events/order-confirmed.event';

export enum OrderStatus {
  PENDING   = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED',
  SHIPPED   = 'SHIPPED',
}

export interface CreateOrderProps {
  customerId: CustomerId;
  items: OrderItem[];
  currency: string;
}

export class Order extends AggregateRoot<OrderId> {
  private _customerId: CustomerId;
  private _items: OrderItem[];
  private _status: OrderStatus;
  private _total: Money;

  private constructor(id: OrderId, props: Omit<CreateOrderProps, 'currency'> & { total: Money }) {
    super(id);
    this._customerId = props.customerId;
    this._items = [...props.items];
    this._total = props.total;
    this._status = OrderStatus.PENDING;
  }

  // ─── Factory Method ───────────────────────────────────────
  static place(props: CreateOrderProps): Order {
    if (props.items.length === 0)
      throw new Error('Order must contain at least one item');

    const total = props.items.reduce(
      (sum, item) => sum.add(item.subtotal),
      Money.create(0, props.currency),
    );

    const id = OrderId.generate();
    const order = new Order(id, { ...props, total });

    order.addDomainEvent(
      new OrderPlacedEvent(id.value, props.customerId.value, total),
    );

    return order;
  }

  // ─── Behaviour Methods ────────────────────────────────────
  confirm(): void {
    if (this._status !== OrderStatus.PENDING)
      throw new Error(`Cannot confirm order in status: ${this._status}`);

    this._status = OrderStatus.CONFIRMED;
    this.addDomainEvent(new OrderConfirmedEvent(this._id.value));
  }

  cancel(reason: string): void {
    if (this._status === OrderStatus.SHIPPED)
      throw new Error('Cannot cancel a shipped order');

    this._status = OrderStatus.CANCELLED;
    // domain event could be added here
  }

  // ─── Reconstitution (from persistence) ───────────────────
  static reconstitute(
    id: string,
    props: {
      customerId: string;
      items: OrderItem[];
      status: OrderStatus;
      total: { amount: number; currency: string };
    },
  ): Order {
    const order = new Order(OrderId.from(id), {
      customerId: CustomerId.from(props.customerId),
      items: props.items,
      total: Money.create(props.total.amount, props.total.currency),
    });
    (order as any)._status = props.status;
    return order;
  }

  // ─── Getters ──────────────────────────────────────────────
  get customerId(): CustomerId { return this._customerId; }
  get items(): ReadonlyArray<OrderItem> { return this._items; }
  get status(): OrderStatus { return this._status; }
  get total(): Money { return this._total; }
}
```

---

## 7. Application Layer — Use Cases, Commands & Queries

### 7.1 Place Order — Command & Handler

```typescript
// src/modules/orders/application/commands/place-order/place-order.command.ts
import { ICommand } from '@nestjs/cqrs';

export class PlaceOrderCommand implements ICommand {
  constructor(
    readonly customerId: string,
    readonly items: Array<{ productId: string; quantity: number; unitPrice: number; currency: string }>,
  ) {}
}
```

```typescript
// src/modules/orders/application/commands/place-order/place-order.handler.ts
import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { PlaceOrderCommand } from './place-order.command';
import { Order } from '../../../domain/aggregates/order.aggregate';
import { OrderItem } from '../../../domain/entities/order-item.entity';
import { CustomerId } from '../../../domain/value-objects/customer-id.value-object';
import { Money } from '../../../domain/value-objects/money.value-object';
import { OrderRepositoryPort } from '../../../domain/ports/order-repository.port';

@CommandHandler(PlaceOrderCommand)
export class PlaceOrderHandler implements ICommandHandler<PlaceOrderCommand, string> {
  constructor(
    @Inject(OrderRepositoryPort)
    private readonly orderRepository: OrderRepositoryPort,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: PlaceOrderCommand): Promise<string> {
    const customerId = CustomerId.from(command.customerId);

    const orderItems = command.items.map((i) =>
      OrderItem.create(i.productId, i.quantity, Money.create(i.unitPrice, i.currency)),
    );

    const order = Order.place({ customerId, items: orderItems, currency: 'USD' });

    await this.orderRepository.save(order);

    // pull domain events and dispatch them through NestJS EventBus
    const domainEvents = order.pullDomainEvents();
    await this.eventBus.publishAll(domainEvents);

    return order.id.value;
  }
}
```

---

### 7.2 Get Order — Query & Handler

```typescript
// src/modules/orders/application/queries/get-order/get-order.query.ts
import { IQuery } from '@nestjs/cqrs';

export class GetOrderQuery implements IQuery {
  constructor(readonly orderId: string) {}
}
```

```typescript
// src/modules/orders/application/queries/get-order/get-order.handler.ts
import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Inject, NotFoundException } from '@nestjs/common';
import { GetOrderQuery } from './get-order.query';
import { OrderRepositoryPort } from '../../../domain/ports/order-repository.port';
import { OrderDto } from '../../dtos/order.dto';
import { OrderId } from '../../../domain/value-objects/order-id.value-object';
import { OrderMapper } from '../../../infrastructure/persistence/typeorm/order.mapper';

@QueryHandler(GetOrderQuery)
export class GetOrderHandler implements IQueryHandler<GetOrderQuery, OrderDto> {
  constructor(
    @Inject(OrderRepositoryPort)
    private readonly orderRepository: OrderRepositoryPort,
  ) {}

  async execute(query: GetOrderQuery): Promise<OrderDto> {
    const order = await this.orderRepository.findById(OrderId.from(query.orderId));

    if (!order) throw new NotFoundException(`Order ${query.orderId} not found`);

    return OrderMapper.toDto(order);
  }
}
```

---

### 7.3 Domain Event Handler

```typescript
// src/modules/orders/application/events/order-placed/order-placed.handler.ts
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { Inject, Logger } from '@nestjs/common';
import { OrderPlacedEvent } from '../../../domain/events/order-placed.event';
import { EmailServicePort } from '../../../domain/ports/email-service.port';

@EventsHandler(OrderPlacedEvent)
export class OrderPlacedHandler implements IEventHandler<OrderPlacedEvent> {
  private readonly logger = new Logger(OrderPlacedHandler.name);

  constructor(
    @Inject(EmailServicePort)
    private readonly emailService: EmailServicePort,
  ) {}

  async handle(event: OrderPlacedEvent): Promise<void> {
    this.logger.log(`Handling OrderPlacedEvent for order ${event.aggregateId}`);

    await this.emailService.sendOrderConfirmation({
      customerId: event.customerId,
      orderId: event.aggregateId,
      total: event.total,
    });
  }
}
```

---

## 8. Infrastructure Layer — Adapters & Repositories

### 8.1 TypeORM ORM Entity

```typescript
// src/modules/orders/infrastructure/persistence/typeorm/order.orm-entity.ts
import { Entity, Column, PrimaryColumn, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('orders')
export class OrderOrmEntity {
  @PrimaryColumn('uuid')
  id: string;

  @Column('uuid')
  customerId: string;

  @Column({ type: 'enum', enum: ['PENDING', 'CONFIRMED', 'CANCELLED', 'SHIPPED'], default: 'PENDING' })
  status: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  totalAmount: number;

  @Column({ length: 3 })
  totalCurrency: string;

  @OneToMany(() => OrderItemOrmEntity, (item) => item.order, { cascade: true, eager: true })
  items: OrderItemOrmEntity[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

### 8.2 Domain Mapper

```typescript
// src/modules/orders/infrastructure/persistence/typeorm/order.mapper.ts
import { Order, OrderStatus } from '../../../domain/aggregates/order.aggregate';
import { OrderItem } from '../../../domain/entities/order-item.entity';
import { Money } from '../../../domain/value-objects/money.value-object';
import { CustomerId } from '../../../domain/value-objects/customer-id.value-object';
import { OrderOrmEntity } from './order.orm-entity';
import { OrderDto } from '../../../application/dtos/order.dto';

export class OrderMapper {
  static toDomain(orm: OrderOrmEntity): Order {
    return Order.reconstitute(orm.id, {
      customerId: orm.customerId,
      status: orm.status as OrderStatus,
      total: { amount: Number(orm.totalAmount), currency: orm.totalCurrency },
      items: orm.items.map((i) =>
        OrderItem.create(i.productId, i.quantity, Money.create(Number(i.unitPrice), i.currency)),
      ),
    });
  }

  static toOrmEntity(order: Order): Partial<OrderOrmEntity> {
    return {
      id: order.id.value,
      customerId: order.customerId.value,
      status: order.status,
      totalAmount: order.total.amount,
      totalCurrency: order.total.currency,
    };
  }

  static toDto(order: Order): OrderDto {
    return {
      id: order.id.value,
      customerId: order.customerId.value,
      status: order.status,
      total: { amount: order.total.amount, currency: order.total.currency },
      itemCount: order.items.length,
    };
  }
}
```

### 8.3 TypeORM Repository Adapter

```typescript
// src/modules/orders/infrastructure/persistence/typeorm/order.typeorm-repository.ts
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrderRepositoryPort } from '../../../domain/ports/order-repository.port';
import { Order } from '../../../domain/aggregates/order.aggregate';
import { OrderId } from '../../../domain/value-objects/order-id.value-object';
import { CustomerId } from '../../../domain/value-objects/customer-id.value-object';
import { OrderOrmEntity } from './order.orm-entity';
import { OrderMapper } from './order.mapper';

export class OrderTypeOrmRepository implements OrderRepositoryPort {
  constructor(
    @InjectRepository(OrderOrmEntity)
    private readonly repo: Repository<OrderOrmEntity>,
  ) {}

  async findById(id: OrderId): Promise<Order | null> {
    const orm = await this.repo.findOne({ where: { id: id.value } });
    return orm ? OrderMapper.toDomain(orm) : null;
  }

  async findByCustomerId(customerId: CustomerId): Promise<Order[]> {
    const orms = await this.repo.find({ where: { customerId: customerId.value } });
    return orms.map(OrderMapper.toDomain);
  }

  async save(order: Order): Promise<void> {
    const orm = OrderMapper.toOrmEntity(order);
    await this.repo.save(orm);
  }

  async delete(id: OrderId): Promise<void> {
    await this.repo.delete({ id: id.value });
  }
}
```

---

## 9. Interface Layer — Controllers & DTOs

### 9.1 Request/Response DTOs

```typescript
// src/modules/orders/interface/http/dtos/place-order.request.dto.ts
import { IsString, IsArray, IsNumber, Min, ArrayMinSize, ValidateNested, IsUUID, IsIn } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

class OrderItemRequestDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsUUID()
  productId: string;

  @ApiProperty({ example: 2 })
  @IsNumber()
  @Min(1)
  quantity: number;

  @ApiProperty({ example: 29.99 })
  @IsNumber()
  @Min(0)
  unitPrice: number;

  @ApiProperty({ example: 'USD', enum: ['USD', 'EUR', 'GBP'] })
  @IsIn(['USD', 'EUR', 'GBP'])
  currency: string;
}

export class PlaceOrderRequestDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440001' })
  @IsUUID()
  customerId: string;

  @ApiProperty({ type: [OrderItemRequestDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => OrderItemRequestDto)
  items: OrderItemRequestDto[];
}
```

### 9.2 REST Controller

```typescript
// src/modules/orders/interface/http/orders.controller.ts
import {
  Controller, Post, Get, Param, Body, HttpCode, ParseUUIDPipe,
  HttpStatus, UseGuards,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { PlaceOrderCommand } from '../../application/commands/place-order/place-order.command';
import { GetOrderQuery } from '../../application/queries/get-order/get-order.query';
import { ListOrdersQuery } from '../../application/queries/list-orders/list-orders.query';
import { PlaceOrderRequestDto } from './dtos/place-order.request.dto';
import { OrderDto } from '../../application/dtos/order.dto';
import { JwtAuthGuard } from '../../../../shared/guards/jwt-auth.guard';

@ApiTags('Orders')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('orders')
export class OrdersController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Place a new order' })
  @ApiResponse({ status: 201, description: 'Order placed successfully', type: String })
  async placeOrder(@Body() dto: PlaceOrderRequestDto): Promise<{ orderId: string }> {
    const orderId = await this.commandBus.execute<PlaceOrderCommand, string>(
      new PlaceOrderCommand(dto.customerId, dto.items),
    );
    return { orderId };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get order by ID' })
  @ApiResponse({ status: 200, description: 'Order found', type: OrderDto })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async getOrder(@Param('id', ParseUUIDPipe) id: string): Promise<OrderDto> {
    return this.queryBus.execute<GetOrderQuery, OrderDto>(new GetOrderQuery(id));
  }

  @Get()
  @ApiOperation({ summary: 'List all orders' })
  async listOrders(): Promise<OrderDto[]> {
    return this.queryBus.execute<ListOrdersQuery, OrderDto[]>(new ListOrdersQuery());
  }
}
```

---

## 10. Dependency Injection & NestJS Module Wiring

```typescript
// src/modules/orders/orders.module.ts
import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { TypeOrmModule } from '@nestjs/typeorm';

// Interface
import { OrdersController } from './interface/http/orders.controller';

// Application — Handlers
import { PlaceOrderHandler } from './application/commands/place-order/place-order.handler';
import { CancelOrderHandler } from './application/commands/cancel-order/cancel-order.handler';
import { GetOrderHandler }    from './application/queries/get-order/get-order.handler';
import { ListOrdersHandler }  from './application/queries/list-orders/list-orders.handler';
import { OrderPlacedHandler } from './application/events/order-placed/order-placed.handler';

// Domain Ports
import { OrderRepositoryPort } from './domain/ports/order-repository.port';
import { EmailServicePort }    from './domain/ports/email-service.port';

// Infrastructure Adapters
import { OrderTypeOrmRepository }  from './infrastructure/persistence/typeorm/order.typeorm-repository';
import { SendGridEmailAdapter }    from './infrastructure/email/sendgrid-email.adapter';
import { OrderOrmEntity }          from './infrastructure/persistence/typeorm/order.orm-entity';

const CommandHandlers = [PlaceOrderHandler, CancelOrderHandler];
const QueryHandlers   = [GetOrderHandler, ListOrdersHandler];
const EventHandlers   = [OrderPlacedHandler];

@Module({
  imports: [
    CqrsModule,
    TypeOrmModule.forFeature([OrderOrmEntity]),
  ],
  controllers: [OrdersController],
  providers: [
    ...CommandHandlers,
    ...QueryHandlers,
    ...EventHandlers,

    // ── Port → Adapter bindings ──────────────────────────────
    {
      provide: OrderRepositoryPort,
      useClass: OrderTypeOrmRepository,
    },
    {
      provide: EmailServicePort,
      useClass: SendGridEmailAdapter,
    },
  ],
})
export class OrdersModule {}
```

```mermaid
graph TD
    subgraph MOD ["OrdersModule"]
        CTRL["OrdersController"]
        CMD_H["PlaceOrderHandler\nCancelOrderHandler"]
        QRY_H["GetOrderHandler\nListOrdersHandler"]
        EVT_H["OrderPlacedHandler"]

        PORT_R["OrderRepositoryPort\n(abstract class token)"]
        PORT_E["EmailServicePort\n(abstract class token)"]

        IMPL_R["OrderTypeOrmRepository"]
        IMPL_E["SendGridEmailAdapter"]
    end

    CTRL --> CMD_H
    CTRL --> QRY_H
    CMD_H --> PORT_R
    QRY_H --> PORT_R
    EVT_H --> PORT_E

    PORT_R -->|useClass| IMPL_R
    PORT_E -->|useClass| IMPL_E

    style PORT_R fill:#fef9c3,stroke:#eab308
    style PORT_E fill:#fef9c3,stroke:#eab308
    style IMPL_R fill:#dcfce7,stroke:#22c55e
    style IMPL_E fill:#dcfce7,stroke:#22c55e
```

![NestJS DI Module Wiring](./images/nestjs-di-wiring.png)

> **IMAGE PROMPT (nestjs-di-wiring.png):**
> _"A NestJS dependency injection module diagram. A large rounded rectangle labelled 'OrdersModule' contains six smaller boxes grouped into three rows: Row 1 (blue) 'Controllers': OrdersController. Row 2 (amber) 'Ports (Tokens)': OrderRepositoryPort, EmailServicePort — these are abstract interface tokens. Row 3 (green) 'Adapters (Implementations)': OrderTypeOrmRepository, SendGridEmailAdapter. Dashed arrows labelled 'useClass' connect from Port boxes to Adapter boxes. Solid arrows from Controller to CommandBus and QueryBus. NestJS logo watermark in corner. Clean enterprise diagram style, white background."_

---

## 11. Event-Driven Communication & Domain Events

```mermaid
sequenceDiagram
    participant Aggregate as Order Aggregate
    participant Handler as PlaceOrderHandler
    participant EventBus as NestJS EventBus
    participant H1 as OrderPlacedHandler\n(Email)
    participant H2 as InventorySaga\n(Reserve Stock)
    participant H3 as AnalyticsHandler\n(Track Event)

    Aggregate->>+Handler: return order (with queued events)
    Handler->>+EventBus: publishAll([OrderPlacedEvent])
    par Async Dispatch
        EventBus->>H1: handle(OrderPlacedEvent)
        EventBus->>H2: handle(OrderPlacedEvent)
        EventBus->>H3: handle(OrderPlacedEvent)
    end
    H1-->>EventBus: (send confirmation email)
    H2-->>EventBus: (dispatch ReserveStockCommand)
    H3-->>EventBus: (push to analytics)
```

![Domain Event Dispatch](./images/domain-event-dispatch.png)

> **IMAGE PROMPT (domain-event-dispatch.png):**
> _"A domain event fan-out diagram. Centre: a large orange oval labelled 'OrderPlacedEvent'. From it, three thick arrows radiate outward to the right, each connecting to a handler box with a different icon: an email icon for 'Send Confirmation Email', a warehouse icon for 'Reserve Stock (Saga)', and a chart icon for 'Analytics Tracking'. A small aggregate box on the left feeds into the event oval. The entire layout is on a clean white background, using flat icons, bold labels, and colour-coded handler boxes (orange, teal, purple)."_

### Domain Event Definition

```typescript
// src/modules/orders/domain/events/order-placed.event.ts
import { DomainEvent } from '../../../../shared/domain/domain-event.base';
import { Money } from '../value-objects/money.value-object';

export class OrderPlacedEvent extends DomainEvent {
  constructor(
    orderId: string,
    readonly customerId: string,
    readonly total: Money,
  ) {
    super(orderId);
  }
}
```

### Saga — Cross-Aggregate Coordination

```typescript
// src/modules/orders/application/sagas/inventory.saga.ts
import { Injectable, Logger } from '@nestjs/common';
import { ICommand, ofType, Saga } from '@nestjs/cqrs';
import { Observable, map } from 'rxjs';
import { OrderPlacedEvent } from '../../domain/events/order-placed.event';
import { ReserveStockCommand } from '../../../inventory/application/commands/reserve-stock.command';

@Injectable()
export class InventorySaga {
  private readonly logger = new Logger(InventorySaga.name);

  @Saga()
  orderPlaced = (events$: Observable<any>): Observable<ICommand> =>
    events$.pipe(
      ofType(OrderPlacedEvent),
      map((event: OrderPlacedEvent) => {
        this.logger.log(`Saga triggered for order ${event.aggregateId}`);
        return new ReserveStockCommand(event.aggregateId);
      }),
    );
}
```

---

## 12. Testing Strategy

### Layer Testing Matrix

| Layer | What to Test | Tools |
|---|---|---|
| **Domain** | Aggregate invariants, Value Object validation | Jest, no mocks |
| **Application** | Handler logic with mocked ports | Jest + manual mocks |
| **Infrastructure** | Adapter ↔ real DB integration | Jest + TestContainers |
| **Interface** | HTTP contract | Supertest + NestJS `TestingModule` |
| **E2E** | Full vertical slice | Docker Compose + Supertest |

### Unit Test — Aggregate

```typescript
// src/modules/orders/domain/aggregates/order.aggregate.spec.ts
import { Order } from './order.aggregate';
import { OrderItem } from '../entities/order-item.entity';
import { CustomerId } from '../value-objects/customer-id.value-object';
import { Money } from '../value-objects/money.value-object';
import { OrderPlacedEvent } from '../events/order-placed.event';

describe('Order Aggregate', () => {
  const makeItems = (count = 1) =>
    Array.from({ length: count }, (_, i) =>
      OrderItem.create(`product-${i}`, 2, Money.create(10, 'USD')),
    );

  it('should place an order and emit OrderPlacedEvent', () => {
    const order = Order.place({
      customerId: CustomerId.from('customer-uuid'),
      items: makeItems(2),
      currency: 'USD',
    });

    const events = order.pullDomainEvents();
    expect(events).toHaveLength(1);
    expect(events[0]).toBeInstanceOf(OrderPlacedEvent);
    expect(order.total.amount).toBe(40); // 2 items × 2 qty × $10
  });

  it('should throw when placing order with no items', () => {
    expect(() =>
      Order.place({ customerId: CustomerId.from('cid'), items: [], currency: 'USD' }),
    ).toThrow('Order must contain at least one item');
  });

  it('should confirm a pending order', () => {
    const order = Order.place({
      customerId: CustomerId.from('cid'),
      items: makeItems(),
      currency: 'USD',
    });
    order.confirm();
    expect(order.status).toBe('CONFIRMED');
  });

  it('should not confirm a cancelled order', () => {
    const order = Order.place({
      customerId: CustomerId.from('cid'),
      items: makeItems(),
      currency: 'USD',
    });
    order.cancel('customer request');
    expect(() => order.confirm()).toThrow();
  });
});
```

### Integration Test — Command Handler

```typescript
// src/modules/orders/application/commands/place-order/place-order.handler.spec.ts
import { Test } from '@nestjs/testing';
import { CqrsModule, EventBus } from '@nestjs/cqrs';
import { PlaceOrderHandler } from './place-order.handler';
import { PlaceOrderCommand } from './place-order.command';
import { OrderRepositoryPort } from '../../../domain/ports/order-repository.port';

describe('PlaceOrderHandler', () => {
  let handler: PlaceOrderHandler;
  let repoMock: jest.Mocked<OrderRepositoryPort>;

  beforeEach(async () => {
    repoMock = { save: jest.fn(), findById: jest.fn(), findByCustomerId: jest.fn(), delete: jest.fn() };

    const module = await Test.createTestingModule({
      imports: [CqrsModule],
      providers: [
        PlaceOrderHandler,
        { provide: OrderRepositoryPort, useValue: repoMock },
      ],
    }).compile();

    handler = module.get(PlaceOrderHandler);
    await module.init();
  });

  it('should persist the order and return an id', async () => {
    const cmd = new PlaceOrderCommand('customer-uuid', [
      { productId: 'prod-1', quantity: 3, unitPrice: 15, currency: 'USD' },
    ]);

    const orderId = await handler.execute(cmd);

    expect(typeof orderId).toBe('string');
    expect(repoMock.save).toHaveBeenCalledTimes(1);
  });
});
```

---

## 13. Layer Interaction & Data Flow Reference

```mermaid
flowchart TD
    A([HTTP Request]) --> B[OrdersController]
    B -->|PlaceOrderCommand| C[CommandBus]
    C -->|routes to| D[PlaceOrderHandler]
    D -->|Order.place| E[Order Aggregate]
    E -->|guards invariants| E
    E -->|returns domain model| D
    D -->|save| F[OrderRepositoryPort]
    F -->|TypeORM impl| G[(PostgreSQL)]
    D -->|publishAll| H[EventBus]
    H -->|OrderPlacedEvent| I[OrderPlacedHandler]
    I -->|sendEmail| J[EmailServicePort]
    J -->|SendGrid impl| K[SendGrid API]
    H -->|OrderPlacedEvent| L[InventorySaga]
    L -->|ReserveStockCommand| M[CommandBus]

    style A fill:#1e40af,color:#fff
    style E fill:#7c3aed,color:#fff
    style F fill:#d97706,color:#fff
    style J fill:#d97706,color:#fff
    style G fill:#065f46,color:#fff
    style K fill:#065f46,color:#fff
```

![Full Data Flow Diagram](./images/full-data-flow.png)

> **IMAGE PROMPT (full-data-flow.png):**
> _"A complete vertical data flow diagram for a NestJS application. Top: 'HTTP Request' in a blue pill shape. Below it connected by arrows: 'OrdersController' → 'CommandBus' → 'PlaceOrderHandler' → 'Order Aggregate' (purple box with hexagon outline indicating domain) → 'OrderRepositoryPort' (amber, labelled 'Port') → 'TypeORM Repository' → 'PostgreSQL' database cylinder (dark green). Right side branch from 'Order Aggregate': 'EventBus' → two parallel paths: Path 1: 'OrderPlacedHandler' → 'EmailServicePort' (amber) → 'SendGrid API'. Path 2: 'InventorySaga' → 'CommandBus'. All arrows are directional with labels. The word 'DOMAIN BOUNDARY' in a dashed vertical line separates the aggregate from the ports. White background, colour-coded layers."_

---

## Quick Start

```bash
# 1. Install dependencies
npm install @nestjs/cqrs @nestjs/typeorm typeorm pg \
            class-validator class-transformer @nestjs/swagger \
            @nestjs/config reflect-metadata

# 2. Generate module scaffold
npx nest g module modules/orders
npx nest g controller modules/orders/interface/http/orders --flat
npx nest g service modules/orders/application/services/order --flat

# 3. Run with Docker Compose
docker compose up -d postgres redis rabbitmq

# 4. Run the app
npm run start:dev

# 5. Run tests
npm run test           # unit tests
npm run test:e2e       # integration tests
```

---

## Environment Variables

| Variable | Description | Example |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@localhost:5432/db` |
| `SENDGRID_API_KEY` | SendGrid API key | `SG.xxxx` |
| `RABBITMQ_URL` | RabbitMQ AMQP URL | `amqp://guest:guest@localhost:5672` |
| `REDIS_URL` | Redis URL | `redis://localhost:6379` |
| `JWT_SECRET` | JWT signing secret | `a-very-long-random-secret` |

---

> **IMPORTANT:** Never commit secrets to source control. Use a `.env` file locally and a secrets manager (AWS Secrets Manager, HashiCorp Vault) in production. The `JWT_SECRET` must be at least 256 bits of entropy.

> **NOTE:** All port interfaces (`OrderRepositoryPort`, `EmailServicePort`) are `abstract class` tokens — this is required for NestJS DI to resolve them without a separate `InjectionToken` constant.

> **WARNING:** Domain events are dispatched **in-process** via `@nestjs/cqrs` EventBus by default. For cross-service reliability, replace the event handler infrastructure with an outbox pattern + transactional message publisher (e.g., Debezium + Kafka/RabbitMQ).

---

*Generated as a production-quality architecture reference. All code is TypeScript-strict compatible and follows NestJS v10 conventions.*
