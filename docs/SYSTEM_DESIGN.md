# EventHub – System Design

EventHub is an event management platform: organizations publish events and sell tickets, attendees book seats and enter with a QR code, staff check people in at the door, and an administrator moderates the platform.

| | |
|---|---|
| **Backend** | Java 21 · Spring Boot 4.1 · Spring Security 7 (JWT) · Spring Data JPA / Hibernate 7 · PostgreSQL |
| **Frontend** | Angular 19 (standalone components, signals, lazy routes) · plain CSS design system |
| **Deployment** | Docker images + docker-compose (PostgreSQL, API, nginx serving the SPA and proxying the API) |

Contents

1. [Requirements](#1-requirements)
2. [Actors and use cases](#2-actors-and-use-cases)
3. [Architecture](#3-architecture)
4. [Data model](#4-data-model)
5. [Business rules and state machines](#5-business-rules-and-state-machines)
6. [Key flows (sequence diagrams)](#6-key-flows)
7. [Security](#7-security)
8. [Concurrency and consistency](#8-concurrency-and-consistency)
9. [API design](#9-api-design)
10. [Frontend architecture](#10-frontend-architecture)
11. [Deployment](#11-deployment)
12. [Scalability and future work](#12-scalability-and-future-work)
13. [Testing strategy](#13-testing-strategy)

---

## 1. Requirements

### Functional

| # | Requirement |
|---|---|
| F1 | Visitors browse and search published events (keyword, category, city, dates, free only, past events) with pagination and sorting (date, popularity, rating, newest). |
| F2 | Users sign up / log in (email + password) and manage their profile and password. |
| F3 | A user creates an **organization** and becomes its *moderator*, or requests to join an existing one. |
| F4 | Moderators manage their team: approve/decline join requests, add members by email, change staff roles, remove members. |
| F5 | Organizers create events (draft), attach **ticket types** (free or paid, quantity, optional sale window), then publish, edit, cancel or delete them. |
| F6 | Attendees register for an event by choosing a ticket type and receive a **QR code ticket**. Free tickets are confirmed immediately, paid tickets stay *pending* until paid at the venue. |
| F7 | Attendees cancel their registration before the event starts, the seat is released. |
| F8 | Staff check attendees in by scanning (camera, USB scanner) or typing the QR code; a pending ticket can be paid and checked in at the same time. |
| F9 | Attendees who attended rate the event (1–5 stars + comment) once it has started; one review per user and event. |
| F10 | Users receive in-app notifications: registration, payment confirmation, event update, cancellation, 24 h reminder, check-in, team membership. |
| F11 | Organizers see statistics per event (registrations by status, check-in rate, revenue, sales per ticket type) and per organization, and export attendees as CSV. |
| F12 | The administrator sees platform statistics, manages users (role, enable/disable), verifies organizations, and manages categories and venues. |
| F13 | Images (event cover, organization logo, avatar) can be uploaded. |

### Non-functional

| Concern | Target / decision |
|---|---|
| Security | BCrypt password hashes, stateless JWT, role + per-organization authorization on every write, validated input, no stack traces leaked. |
| Consistency | An event or ticket type can never be oversold, even under concurrent bookings (pessimistic row lock). |
| Performance | Catalogue pages served in one query plus one batched price lookup (no N+1), DB indexes on hot filters, lazy-loaded frontend routes (initial bundle ≈ 95 kB gzipped). |
| Usability | Responsive layout (phone to desktop), light and dark themes, clear empty/loading/error states. |
| Maintainability | Feature-based packages, DTOs separated from entities, interface + implementation services, global error handler, automated tests. |
| Portability | All configuration through environment variables, Docker images for every tier. |

---

## 2. Actors and use cases

| Actor | Description |
|---|---|
| Visitor | Anonymous user, read-only access to the public catalogue. |
| Attendee (`USER`) | Registered account, books tickets, reviews events. |
| Staff member | User belonging to an organization, with a **staff role**: `MODERATOR`, `ORGANIZER`, `CHECK_IN` or `VOLUNTEER`. Their platform role becomes `ORGANIZER`. |
| Administrator (`ADMIN`) | Platform operator. |
| Scheduler | Background jobs (status transitions, reminders). |

```mermaid
flowchart LR
    V((Visitor))
    A((Attendee))
    S((Staff))
    M((Moderator))
    AD((Admin))
    T((Scheduler))

    subgraph EventHub
        UC1[Browse / search events]
        UC2[View event, organizer, reviews]
        UC3[Sign up / log in]
        UC4[Book a ticket]
        UC5[Cancel registration]
        UC6[Show QR ticket]
        UC7[Review an event]
        UC8[Read notifications]
        UC9[Create organization / request to join]
        UC10[Manage events and tickets]
        UC11[Check attendees in]
        UC12[View stats, export attendees]
        UC13[Manage team]
        UC14[Moderate users and organizations]
        UC15[Manage categories and venues]
        UC16[Start/complete events, send reminders]
    end

    V --> UC1 & UC2 & UC3
    A --> UC1 & UC4 & UC5 & UC6 & UC7 & UC8 & UC9
    S --> UC10 & UC11 & UC12
    M --> UC13
    AD --> UC14 & UC15
    T --> UC16
    A -. is a .-> V
    S -. is an .-> A
    M -. is a .-> S
```

### Staff role permissions

| Action | MODERATOR | ORGANIZER | CHECK_IN | VOLUNTEER | ADMIN |
|---|:-:|:-:|:-:|:-:|:-:|
| Edit organization, manage team | ✓ | | | | ✓ |
| Create / edit / publish / cancel / delete events and tickets | ✓ | ✓ | | | ✓ |
| Check attendees in, confirm payments | ✓ | ✓ | ✓ | | ✓ |
| View dashboard, stats, attendee list, export | ✓ | ✓ | ✓ | ✓ | ✓ |

---

## 3. Architecture

### Container view

```mermaid
flowchart LR
    browser["Browser<br/>Angular SPA"]
    subgraph Docker host
        nginx["nginx<br/>static SPA + reverse proxy"]
        api["Spring Boot API<br/>:8080"]
        db[("PostgreSQL")]
        files[["uploads volume"]]
    end
    browser -- "HTTPS: /, /api/**, /uploads/**" --> nginx
    nginx -- "/api/**, /uploads/**" --> api
    api -- JDBC --> db
    api -- "read/write images" --> files
```

Single origin in production: nginx serves the SPA and forwards `/api` and `/uploads` to the API, so the browser never needs CORS. In development the SPA runs on `localhost:4200` and calls `localhost:8080` directly (CORS is allowed for configured origins).

### Backend layers

```mermaid
flowchart TB
    subgraph "HTTP"
        F[JwtAuthenticationFilter] --> C["Controllers<br/>@RestController, @Valid DTOs"]
    end
    C --> S["Services<br/>interfaces + implementation, @Transactional,<br/>business rules, authorization"]
    S --> R["Repositories<br/>Spring Data JPA, JPQL, Specifications"]
    R --> E[(Entities / PostgreSQL)]
    S --> MAP[Mappers<br/>entity ⇄ DTO]
    C -. errors .-> H["GlobalExceptionHandler<br/>→ ApiError JSON"]
    SCH[EventScheduler] --> R
```

* **Controllers** only translate HTTP ↔ DTO and read the current user from `SecurityUtils`.
* **Services** hold every business rule and authorization check (via `OrganizationAccessService`), and own the transaction boundary.
* **Entities never leave the service layer**: responses are Java records built by mappers. This avoids lazy-loading surprises, infinite JSON recursion and leaking fields such as password hashes.

### Package structure (feature first)

```
tn.rnu.isetmd.event
├── admin            platform statistics, user moderation endpoints
├── auth             register / login / me
├── category         CRUD (admin)
├── common           ApiError, PageResponse, exceptions + GlobalExceptionHandler
├── config           SecurityConfig, JWT, WebConfig, DataSeeder
├── enums
├── event            events, search Specification, scheduler, stats
├── file             image upload storage
├── notification
├── organizer        organizations
├── organizerStaff   team membership + OrganizationAccessService
├── registration     booking, cancellation, check-in, CSV export
├── review
├── ticketType
├── user
└── venue
```

Each feature package contains `controller / dto / entity / mapper / repository / service / service.implementation`.

---

## 4. Data model

```mermaid
erDiagram
    USERS ||--o| ORGANIZATION_STAFF : "belongs to (max 1)"
    ORGANIZATION ||--o{ ORGANIZATION_STAFF : has
    ORGANIZATION ||--o{ EVENTS : organizes
    CATEGORIES ||--o{ EVENTS : classifies
    VENUES ||--o{ EVENTS : hosts
    EVENTS ||--o{ TICKET_TYPES : sells
    EVENTS ||--o{ REGISTRATIONS : receives
    TICKET_TYPES ||--o{ REGISTRATIONS : "booked as"
    USERS ||--o{ REGISTRATIONS : makes
    USERS ||--o{ REVIEWS : writes
    EVENTS ||--o{ REVIEWS : receives
    USERS ||--o{ NOTIFICATIONS : receives
    EVENTS |o--o{ NOTIFICATIONS : about

    USERS {
        bigint id PK
        varchar email UK
        varchar password "BCrypt"
        varchar first_name
        varchar last_name
        varchar role "USER|ORGANIZER|ADMIN"
        boolean enabled
        varchar profile_image
        timestamp created_at
    }
    ORGANIZATION {
        bigint id PK
        varchar name
        varchar description
        varchar logo
        varchar email
        varchar phone
        varchar website
        boolean verified
    }
    ORGANIZATION_STAFF {
        bigint id PK
        bigint organization_id FK
        bigint user_id FK, UK
        varchar role "MODERATOR|ORGANIZER|CHECK_IN|VOLUNTEER"
        varchar status "PENDING|APPROVED|REJECTED"
        timestamp added_at
    }
    CATEGORIES {
        bigint id PK
        varchar name UK
        varchar description
    }
    VENUES {
        bigint id PK
        varchar name
        varchar address
        varchar city
        varchar country
        double latitude
        double longitude
        int capacity
    }
    EVENTS {
        bigint id PK
        varchar title
        text description
        varchar cover_image
        bigint category_id FK
        bigint venue_id FK
        bigint organizer_id FK
        timestamp start_date_time
        timestamp end_date_time
        int capacity
        int registered_count "denormalized"
        varchar status
        double average_rating "denormalized"
        int review_count "denormalized"
        boolean reminder_sent
    }
    TICKET_TYPES {
        bigint id PK
        bigint event_id FK
        varchar name
        decimal price
        int quantity
        int sold_quantity
        timestamp sale_start
        timestamp sale_end
        boolean active
    }
    REGISTRATIONS {
        bigint id PK
        bigint user_id FK
        bigint event_id FK
        bigint ticket_type_id FK
        varchar status "PENDING|CONFIRMED|CHECKED_IN|CANCELLED"
        varchar qr_code UK
        timestamp registered_at
        timestamp checked_in_at
        timestamp cancelled_at
    }
    REVIEWS {
        bigint id PK
        bigint user_id FK
        bigint event_id FK
        int rating "1..5"
        varchar comment
    }
    NOTIFICATIONS {
        bigint id PK
        bigint user_id FK
        bigint event_id FK "nullable"
        varchar type
        varchar title
        varchar message
        boolean is_read
        timestamp created_at
    }
```

### Constraints and indexes

| Table | Constraint / index | Why |
|---|---|---|
| `users` | `UNIQUE(email)` | login identifier |
| `organization_staff` | `UNIQUE(user_id)`, `UNIQUE(organization_id, user_id)` | a user belongs to at most one organization |
| `registrations` | `UNIQUE(user_id, event_id)`, `UNIQUE(qr_code)`, index `(event_id, status)` | one registration per user and event (a cancelled one is reused), fast attendee lists and counts |
| `reviews` | `UNIQUE(user_id, event_id)` | one review per attendee |
| `events` | index `(status, start_date_time)`, index `(organizer_id)` | catalogue query and dashboards |
| `notifications` | index `(user_id, is_read)` | unread badge polled every minute |

### Denormalized counters

`events.registered_count`, `events.average_rating`, `events.review_count` and `ticket_types.sold_quantity` are stored instead of computed with `COUNT/AVG` on every catalogue read. They are updated in the same transaction as the change that affects them (registration, cancellation, review), which keeps reads cheap: the catalogue is read far more often than it is written.

### Class diagram (domain)

```mermaid
classDiagram
    class User {
        Long id
        String email
        String password
        UserRole role
        boolean enabled
        getFullName()
    }
    class Organization {
        Long id
        String name
        boolean verified
    }
    class OrganizationStaff {
        StaffRole role
        RequestStatus status
    }
    class Event {
        String title
        LocalDateTime startDateTime
        LocalDateTime endDateTime
        int capacity
        int registeredCount
        EventStatus status
        double averageRating
        getAvailableSeats() int
    }
    class TicketType {
        String name
        BigDecimal price
        int quantity
        int soldQuantity
        boolean active
        getAvailable() int
        isOnSale(now) boolean
    }
    class Registration {
        RegistrationStatus status
        String qrCode
        LocalDateTime checkedInAt
    }
    class Review {
        int rating
        String comment
    }
    class Notification {
        NotificationType type
        boolean read
    }
    class Category
    class Venue

    Organization "1" --> "*" OrganizationStaff
    OrganizationStaff "0..1" --> "1" User
    Organization "1" --> "*" Event : organizer
    Event "*" --> "1" Category
    Event "*" --> "1" Venue
    Event "1" --> "*" TicketType
    Registration "*" --> "1" Event
    Registration "*" --> "1" TicketType
    Registration "*" --> "1" User
    Review "*" --> "1" Event
    Review "*" --> "1" User
    Notification "*" --> "1" User
    Notification "*" --> "0..1" Event
```

---

## 5. Business rules and state machines

### Event lifecycle

```mermaid
stateDiagram-v2
    [*] --> DRAFT : create
    DRAFT --> PUBLISHED : publish (needs ≥1 active ticket,<br/>start in the future)
    DRAFT --> [*] : delete
    PUBLISHED --> ONGOING : scheduler, start reached
    PUBLISHED --> COMPLETED : scheduler, end reached
    ONGOING --> COMPLETED : scheduler, end reached
    PUBLISHED --> CANCELLED : cancel (registrations cancelled,<br/>attendees notified)
    ONGOING --> CANCELLED : cancel
    PUBLISHED --> [*] : delete (only without active registrations)
    COMPLETED --> [*]
    CANCELLED --> [*]
```

* Drafts are visible to the organization's staff only (anonymous `GET /api/events/{id}` returns 404).
* Changing the date or venue of a published event notifies attendees and re-arms the 24 h reminder.
* Capacity can't go below the number of registrations, nor above the venue's capacity.

### Registration lifecycle

```mermaid
stateDiagram-v2
    [*] --> CONFIRMED : book a free ticket
    [*] --> PENDING : book a paid ticket
    PENDING --> CONFIRMED : staff confirms payment
    PENDING --> CHECKED_IN : check-in with "confirm payment"
    CONFIRMED --> CHECKED_IN : QR code scanned
    PENDING --> CANCELLED : attendee cancels (before start)<br/>or event cancelled
    CONFIRMED --> CANCELLED : attendee cancels (before start)<br/>or event cancelled
    CANCELLED --> PENDING : books again
    CANCELLED --> CONFIRMED : books again
```

### Booking rules

A booking is accepted only when **all** of these hold, checked under the event row lock:

1. event status is `PUBLISHED` or `ONGOING` and the event has not ended,
2. the ticket type is active and inside its sale window (`saleStart ≤ now < saleEnd`),
3. `ticket.soldQuantity < ticket.quantity` (ticket stock),
4. `event.registeredCount < event.capacity` (venue seats),
5. the user has no non-cancelled registration for this event.

### Membership rules

* A user has at most one membership row. Creating an organization or joining another one is blocked while a membership is `PENDING` or `APPROVED`; a `REJECTED` row is cleared automatically.
* An organization always keeps at least one moderator (demotion and removal of the last one are refused).
* Approving a membership promotes the platform role `USER → ORGANIZER`; leaving demotes it back.

---

## 6. Key flows

### Authentication

```mermaid
sequenceDiagram
    autonumber
    participant B as Angular
    participant A as AuthController
    participant S as AuthService
    participant DB as PostgreSQL
    B->>A: POST /api/auth/login {email, password}
    A->>S: login(request)  [@Valid]
    S->>DB: find user by email (case insensitive)
    S->>S: BCrypt.matches(password, hash)
    alt wrong credentials
        S-->>B: 401 "Invalid email or password"
    else disabled account
        S-->>B: 403 "This account has been disabled"
    end
    S->>S: sign JWT (HS256, sub=email, userId, role, exp=24h)
    S-->>B: 200 {token, expiresIn, user}
    B->>B: store token, user in localStorage (signals)
    Note over B: every next call: Authorization: Bearer token
    B->>A: GET /api/... + Bearer
    participant F as JwtAuthenticationFilter
    F->>F: verify signature + expiration
    F->>DB: load user by id (role, enabled)
    F->>F: SecurityContext ← (userId, email, ROLE_x)
```

Reloading the user on each request means a role change or a disabled account takes effect immediately instead of when the token expires (24 h). The cost is one primary-key lookup per request, which can be cached later (see §12).

### Booking a ticket (concurrency safe)

```mermaid
sequenceDiagram
    autonumber
    participant U as Attendee
    participant RS as RegistrationService
    participant DB as PostgreSQL
    participant N as NotificationService
    U->>RS: POST /api/registrations {ticketTypeId}
    RS->>DB: BEGIN
    RS->>DB: SELECT ticket_type
    RS->>DB: SELECT event ... FOR UPDATE (row lock)
    Note over RS,DB: concurrent bookings of the same event wait here
    RS->>DB: re-read ticket counters (refresh)
    RS->>RS: check status, sale window, stock, seats, duplicates
    alt rule violated
        RS-->>U: 400 / 409 + message (ROLLBACK)
    end
    RS->>DB: INSERT/UPDATE registration (QR = EVT-<random UUID>)
    RS->>DB: UPDATE ticket_types SET sold_quantity+1
    RS->>DB: UPDATE events SET registered_count+1
    RS->>N: notify(REGISTRATION)
    RS->>DB: COMMIT (lock released)
    RS-->>U: 201 {registration with qrCode}
```

### Check-in at the entrance

```mermaid
sequenceDiagram
    autonumber
    participant St as Staff (check-in page)
    participant RS as RegistrationService
    participant AC as OrganizationAccessService
    participant DB as PostgreSQL
    St->>St: camera (BarcodeDetector) or USB scanner reads QR
    St->>RS: POST /api/registrations/check-in {eventId, qrCode, confirmPayment}
    RS->>AC: checkAccess(event.organizer, MODERATOR|ORGANIZER|CHECK_IN)
    RS->>DB: find registration by qr_code (unique index)
    alt unknown code / other event / cancelled / already checked in
        RS-->>St: 404 / 403 / 400 / 409 "Access refused" + reason
    else pending payment and confirmPayment = false
        RS-->>St: 400 "Payment not confirmed" → UI offers "confirm & check in"
    end
    RS->>DB: status = CHECKED_IN, checked_in_at = now
    RS-->>St: 200 "Access granted · Welcome <name>"
```

### Background jobs

| Job | Frequency | What it does |
|---|---|---|
| `EventScheduler.updateEventStatuses` | every minute | two bulk `UPDATE`s: `PUBLISHED → ONGOING` when started, `PUBLISHED/ONGOING → COMPLETED` when ended |
| `EventScheduler.sendReminders` | every 15 min | events starting within 24 h with `reminder_sent = false` → one notification per active attendee, then flag the event |

The `reminder_sent` flag makes the reminder job idempotent: restarting the API or running the job twice never sends duplicates.

---

## 7. Security

| Layer | Mechanism |
|---|---|
| Passwords | BCrypt (`BCryptPasswordEncoder`, cost 10), never returned by the API (`@ToString.Exclude`, DTOs) |
| Authentication | Stateless JWT (HS256, 24 h), secret from `JWT_SECRET`; no server session, CSRF protection disabled accordingly |
| URL rules | `SecurityFilterChain`: public `GET` catalogue, `POST /api/auth/**` open, `/api/admin/**` → `ROLE_ADMIN`, everything else authenticated |
| Method rules | `@PreAuthorize` on admin-only writes (categories, venue edit/delete, organization verification) |
| Resource rules | `OrganizationAccessService.checkAccess(orgId, roles…)` in services: the caller must be an *approved* staff member of the owning organization with an allowed staff role (or admin) |
| Ownership | registrations, reviews and notifications are checked against the current user id; someone else's resource answers **404** (no existence leak) |
| Input | Bean Validation on all request DTOs, enums parsed strictly, uploads restricted to JPEG/PNG/WEBP/GIF ≤ 5 MB and renamed to a random UUID (no path traversal) |
| Errors | `GlobalExceptionHandler` maps exceptions to `{status, error, message, path, fieldErrors}`; unexpected errors are logged and answered with a generic 500 |
| Tickets | QR payload is a 128-bit random identifier, not guessable and not derived from ids; it is only returned to its owner |
| CORS | Allowed origins from `CORS_ORIGINS`; not needed in production (same origin through nginx) |
| Login enumeration | Same message for unknown email and wrong password |

---

## 8. Concurrency and consistency

* **Overselling**: the seat counter is shared state. Booking and cancellation lock the event row with `SELECT … FOR UPDATE` (`entityManager.refresh(event, PESSIMISTIC_WRITE)`), then re-read the ticket counters. All writers of the counters go through this lock, so the checks and the increments are atomic. Verified with 40 parallel bookings on a 10-seat event: exactly 10 succeeded and 30 got 409.
* **Lost updates on unrelated fields**: `Event` and `TicketType` are annotated `@DynamicUpdate`, so an organizer editing the title only writes the changed columns and can't overwrite `registered_count` with a stale value.
* **Uniqueness races**: database unique constraints are the last line of defence (`registrations(user_id, event_id)`, `reviews(user_id, event_id)`, `users(email)`); a violation becomes a 409 through the exception handler.
* **Transactions**: every service is `@Transactional` (read-only for queries), `spring.jpa.open-in-view=false` so no SQL runs during JSON serialization.

---

## 9. API design

* REST, JSON, resource-oriented URLs under `/api`, plural nouns, sub-resources for ownership (`/api/events/{id}/ticket-types`, `/api/organizations/{id}/staff`).
* State transitions are explicit `PATCH` actions (`/publish`, `/cancel`, `/approve`, `/check-in`) rather than generic status updates, so each one can enforce its own rules.
* Status codes: `201` create, `204` delete or "nothing" (e.g. `GET /api/organizations/me` without membership), `400` validation/business rule, `401` no or invalid token, `403` not allowed, `404` missing or not visible, `409` conflict (duplicate, sold out, full).
* Pagination: `?page=&size=` and a stable envelope `{content, page, size, totalElements, totalPages, last}`.
* Dates: ISO-8601 local date-times (`2026-11-02T09:00:00`).

The full endpoint list is in [API.md](API.md).

---

## 10. Frontend architecture

```mermaid
flowchart TB
    subgraph Angular SPA
        R["Router<br/>lazy loadComponent per page<br/>authGuard / guestGuard / roleGuard"]
        P["Pages<br/>home, events, event detail, tickets,<br/>dashboard, check-in, admin..."]
        SH["Shared UI<br/>event card, QR code, stars,<br/>image upload, pagination, pipes"]
        SV["Services<br/>AuthService (signals), EventService,<br/>RegistrationService, ..."]
        I["authInterceptor<br/>adds Bearer token,<br/>401 → logout + redirect"]
    end
    R --> P --> SH
    P --> SV --> I --> API[(REST API)]
```

* **Standalone components + signals**: no NgModules; component state uses `signal`/`computed`, the session is a signal in `AuthService` persisted to `localStorage`.
* **Routing**: every page is lazy loaded; route params and query params are bound to component inputs (`withComponentInputBinding`). The event catalogue keeps its filters in the URL so searches are shareable.
* **Guards**: `authGuard` (redirects to login with `returnUrl`), `guestGuard`, `roleGuard('ADMIN')`. Guards are a UX convenience; the API enforces every rule.
* **Errors**: the interceptor handles expired sessions globally; pages display API messages through `SharedService.errorMessage()` and a toast service.
* **QR codes**: rendered client-side on a canvas (`qrcode` library) from the ticket identifier; scanned with the browser `BarcodeDetector` API when available, with manual or USB-scanner input as a fallback.
* **Styling**: one global design system (`styles.css`) with CSS variables, automatic dark mode (`prefers-color-scheme`), responsive grid; component styles only hold layout.

---

## 11. Deployment

```mermaid
flowchart LR
    subgraph docker-compose
        fe["frontend<br/>nginx:alpine<br/>:8081 → 80"]
        be["backend<br/>eclipse-temurin:21-jre<br/>:8080"]
        pg[("db<br/>postgres:17<br/>volume db-data")]
        up[["volume uploads"]]
    end
    user((User)) --> fe
    fe -->|/api, /uploads| be
    be --> pg
    be --> up
```

* Multi-stage builds: Maven / Node images build the artifacts, slim runtime images run them (the API runs as a non-root user).
* Configuration by environment variables: `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`, `JWT_SECRET`, `JWT_EXPIRATION`, `CORS_ORIGINS`, `UPLOAD_DIR`, `SEED_DATA`, `DDL_AUTO`, `PORT`.
* The database schema is generated by Hibernate (`ddl-auto=update`) for this project; see §12 for production migrations.

---

## 12. Scalability and future work

The current design targets a university or regional platform (thousands of users, events of a few thousand seats) on a single API instance. The table below lists what to change as load grows.

| Bottleneck / need | Evolution |
|---|---|
| Schema changes in production | Replace `ddl-auto=update` with versioned **Flyway** migrations (the starter is already available). |
| Several API instances | The API is already stateless (JWT). Move uploads to object storage (S3/MinIO) behind `FileStorageService`, and run the schedulers on one node only (ShedLock). |
| User lookup on every request | Cache `userId → (role, enabled)` (Caffeine/Redis, short TTL) in the JWT filter. |
| Catalogue read load | HTTP caching / CDN for public `GET`s, Redis cache of the first catalogue pages, PostgreSQL read replica. Full-text search (PostgreSQL `tsvector` or Elasticsearch) instead of `LIKE`. |
| Very hot events (flash sales) | Replace the row lock by a conditional atomic update (`UPDATE … SET sold = sold + 1 WHERE sold < quantity`) or a Redis counter, and put bookings behind a queue. |
| Notifications | Publish domain events (`RegistrationCreated`, `EventCancelled`…) to a message broker (RabbitMQ/Kafka); consumers send in-app, e-mail and push notifications, and the UI receives them over WebSocket/SSE instead of polling. |
| Payments | Integrate a payment gateway (e.g. Konnect, Flouci, Stripe): `PENDING` registration → payment intent → webhook confirms. A reservation expiry job releases unpaid seats. |
| Observability | Spring Boot Actuator health/metrics, Prometheus + Grafana, structured logs with request ids. |
| Security hardening | Refresh tokens with rotation, rate limiting on `/api/auth/*`, e-mail verification and password reset, HTTPS everywhere (TLS at nginx). |

---

## 13. Testing strategy

| Level | Tooling | Coverage |
|---|---|---|
| Unit | JUnit 5, AssertJ | domain rules (`TicketType.isOnSale`, seat computations), `JwtService` (signature, expiration) |
| Integration (API) | `@SpringBootTest` + MockMvc on H2 (PostgreSQL mode) | auth (hashing, validation, 401/403), organization creation and roles, draft visibility, publishing rules, capacity and duplicates, paid ticket → confirm → check-in, review eligibility, cancellation notifications, staff approval |
| Concurrency | Script firing 40 parallel bookings on a 10-seat event against PostgreSQL | exactly 10 accepted |
| End-to-end | Headless Chrome (Puppeteer) through the real UI | organizer creates and publishes an event with a ticket, a new user signs up and books, staff checks the ticket in (pending → confirm → duplicate refused) |

Run the backend suite with `./mvnw test` (20 tests).
