# EventHub API (Spring Boot)

See the [root README](../../README.md) to run the project, [docs/API.md](docs/API.md) for the endpoints
and [docs/SYSTEM_DESIGN.md](docs/SYSTEM_DESIGN.md) for the architecture.

Entities: User, Organization (organizer profile), OrganizationStaff, Event, Category, Venue, TicketType,
Registration, Review, Notification.

```bash
./mvnw spring-boot:run   # needs PostgreSQL, database "event"
./mvnw test              # H2 in-memory, no database needed
```
