# EventHub REST API

Base URL: `http://localhost:8080` (development) or same origin behind nginx (production).

* Authentication: `Authorization: Bearer <token>` from `/api/auth/login` or `/api/auth/register`.
* Access column: **Public** (no token), **User** (any logged-in user), **Staff** (approved member of the event's organization, with the roles listed), **Admin**.
* Errors always use this shape:

```json
{
  "timestamp": "2026-10-26T22:49:58.657",
  "status": 409,
  "error": "Conflict",
  "message": "This ticket type is sold out",
  "path": "/api/registrations",
  "fieldErrors": null
}
```

`fieldErrors` is a `{field: message}` map on validation errors (HTTP 400).

Paginated responses: `{ "content": [...], "page": 0, "size": 12, "totalElements": 42, "totalPages": 4, "last": false }`.

---

## Auth

| Method | Path | Access | Body / params | Response |
|---|---|---|---|---|
| POST | `/api/auth/register` | Public | `{firstName, lastName, email, password (≥8)}` | `201 {token, expiresIn, user}` |
| POST | `/api/auth/login` | Public | `{email, password}` | `200 {token, expiresIn, user}` · 401 wrong credentials · 403 disabled |
| GET | `/api/auth/me` | User | | `UserResponse` |

## Users (current user)

| Method | Path | Access | Body | Response |
|---|---|---|---|---|
| GET | `/api/users/me` | User | | `UserResponse` |
| PUT | `/api/users/me` | User | `{firstName, lastName, profileImage}` | `UserResponse` |
| PUT | `/api/users/me/password` | User | `{currentPassword, newPassword}` | `204` |

## Events

| Method | Path | Access | Body / params | Response |
|---|---|---|---|---|
| GET | `/api/events` | Public | `keyword, categoryId, city, organizationId, from (yyyy-MM-dd), to, freeOnly, includePast, sort=date\|popular\|rating\|newest, page, size (≤50)` | `Page<EventResponse>` (published + ongoing, + completed when `includePast`) |
| GET | `/api/events/{id}` | Public (drafts: Staff) | | `EventResponse` |
| GET | `/api/events/organization/me` | Staff (any role) | | `EventResponse[]` all statuses |
| GET | `/api/events/{id}/stats` | Staff (any role) | | `EventStatsResponse` |
| POST | `/api/events` | Staff MODERATOR/ORGANIZER | `{title, description, coverImage, categoryId, venueId, startDateTime, endDateTime, capacity}` | `201 EventResponse` (DRAFT) |
| PUT | `/api/events/{id}` | Staff MODERATOR/ORGANIZER | same as create | `EventResponse` |
| PATCH | `/api/events/{id}/publish` | Staff MODERATOR/ORGANIZER | | `EventResponse` (needs an active ticket) |
| PATCH | `/api/events/{id}/cancel` | Staff MODERATOR/ORGANIZER | `{reason?}` | `EventResponse` (registrations cancelled, attendees notified) |
| DELETE | `/api/events/{id}` | Staff MODERATOR/ORGANIZER | | `204` · 409 when it has active registrations |

`EventResponse`: `id, title, description, coverImage, categoryId, categoryName, venueId, venueName, venueAddress, venueCity, startDateTime, endDateTime, capacity, registeredCount, availableSeats, status, organizerId, organizerName, organizerLogo, organizerVerified, minPrice, averageRating, reviewCount, createdAt, updatedAt`

## Ticket types

| Method | Path | Access | Body | Response |
|---|---|---|---|---|
| GET | `/api/events/{eventId}/ticket-types` | Public (inactive ones: Staff) | | `TicketTypeResponse[]` |
| POST | `/api/events/{eventId}/ticket-types` | Staff MODERATOR/ORGANIZER | `{name, description, price (≥0), quantity (≥1), saleStart?, saleEnd?, active?}` | `201 TicketTypeResponse` |
| GET | `/api/ticket-types/{id}` | User | | `TicketTypeResponse` |
| PUT | `/api/ticket-types/{id}` | Staff MODERATOR/ORGANIZER | same as create (price frozen once sold) | `TicketTypeResponse` |
| DELETE | `/api/ticket-types/{id}` | Staff MODERATOR/ORGANIZER | | `204` · 409 when already sold (deactivate instead) |

## Registrations

| Method | Path | Access | Body / params | Response |
|---|---|---|---|---|
| POST | `/api/registrations` | User | `{ticketTypeId}` | `201 RegistrationResponse` (CONFIRMED if free, PENDING if paid) · 409 sold out / full / already registered |
| GET | `/api/registrations/me` | User | | `RegistrationResponse[]` (with QR code) |
| GET | `/api/registrations/event/{eventId}/me` | User | | `RegistrationResponse` or `204` |
| GET | `/api/registrations/{id}` | Owner or Staff | | `RegistrationResponse` |
| PATCH | `/api/registrations/{id}/cancel` | Owner | | `RegistrationResponse` (before the event starts) |
| PATCH | `/api/registrations/{id}/confirm` | Staff MODERATOR/ORGANIZER/CHECK_IN | | `RegistrationResponse` (payment received) |
| GET | `/api/registrations/event/{eventId}` | Staff (any role) | `status?` | `RegistrationResponse[]` (QR codes hidden) |
| GET | `/api/registrations/event/{eventId}/export` | Staff (any role) | | `text/csv` attachment |
| POST | `/api/registrations/check-in` | Staff MODERATOR/ORGANIZER/CHECK_IN | `{eventId, qrCode, confirmPayment?}` | `RegistrationResponse` (CHECKED_IN) · 400 pending/cancelled · 403 other event · 404 unknown · 409 already checked in |

## Reviews

| Method | Path | Access | Body | Response |
|---|---|---|---|---|
| GET | `/api/reviews/event/{eventId}` | Public | | `ReviewResponse[]` |
| GET | `/api/reviews/me` | User | | `ReviewResponse[]` |
| GET | `/api/reviews/{id}` | User | | `ReviewResponse` |
| POST | `/api/reviews` | Attendee (CONFIRMED/CHECKED_IN, event started) | `{eventId, rating 1-5, comment?}` | `201 ReviewResponse` · 409 already reviewed |
| PUT | `/api/reviews/{id}` | Author | `{rating, comment?}` | `ReviewResponse` |
| DELETE | `/api/reviews/{id}` | Author or Admin | | `204` |

## Organizations and staff

| Method | Path | Access | Body / params | Response |
|---|---|---|---|---|
| GET | `/api/organizations` | Public | `search?, verified?` | `OrganizationResponse[]` |
| GET | `/api/organizations/{id}` | Public | | `OrganizationResponse` |
| GET | `/api/organizations/me` | User | | `{organization, staffId, role, status}` or `204` |
| GET | `/api/organizations/me/stats` | Staff | | `{totalEvents, activeEvents, totalRegistrations, revenue, staffCount, pendingRequests}` |
| POST | `/api/organizations` | User without membership | `{name, description, email, phone, website, address, logo}` | `201` (creator = MODERATOR, role → ORGANIZER) |
| PUT | `/api/organizations/{id}` | Staff MODERATOR | same as create | `OrganizationResponse` |
| DELETE | `/api/organizations/{id}` | Staff MODERATOR or Admin | | `204` · 409 if it has events |
| PATCH | `/api/organizations/{id}/verify` | Admin | `{verified}` | `OrganizationResponse` |
| POST | `/api/organizations/{id}/join` | User without membership | | `201 StaffResponse` (PENDING) |
| GET | `/api/organizations/{id}/staff` | Staff (any role) | | `StaffResponse[]` |
| POST | `/api/organizations/{id}/staff` | Staff MODERATOR | `{email, role}` | `201 StaffResponse` (APPROVED) |
| PATCH | `/api/organizations/{id}/staff/{staffId}/approve` | Staff MODERATOR | `{role}?` | `StaffResponse` |
| PATCH | `/api/organizations/{id}/staff/{staffId}/reject` | Staff MODERATOR | | `StaffResponse` |
| PATCH | `/api/organizations/{id}/staff/{staffId}/role` | Staff MODERATOR | `{role}` | `StaffResponse` |
| DELETE | `/api/organizations/{id}/staff/{staffId}` | Staff MODERATOR, or the member himself (leave / withdraw) | | `204` |

## Notifications

| Method | Path | Access | Params | Response |
|---|---|---|---|---|
| GET | `/api/notifications` | User | `page, size` | `Page<NotificationResponse>` newest first |
| GET | `/api/notifications/unread-count` | User | | `{count}` |
| PATCH | `/api/notifications/{id}/read` | Owner | | `NotificationResponse` |
| PATCH | `/api/notifications/read-all` | User | | `204` |
| DELETE | `/api/notifications/{id}` | Owner | | `204` |

## Categories and venues

| Method | Path | Access | Body / params | Response |
|---|---|---|---|---|
| GET | `/api/categories` | Public | | `CategoryResponse[]` |
| GET | `/api/categories/{id}` | Public | | `CategoryResponse` |
| POST / PUT | `/api/categories`, `/api/categories/{id}` | Admin | `{name, description, image}` | `CategoryResponse` |
| DELETE | `/api/categories/{id}` | Admin | | `204` · 409 if used |
| GET | `/api/venues` | Public | `search?` | `VenueResponse[]` |
| GET | `/api/venues/cities` | Public | | `string[]` |
| GET | `/api/venues/{id}` | Public | | `VenueResponse` |
| POST | `/api/venues` | Organizer or Admin | `{name, address, city, country, latitude, longitude, capacity, description}` | `201 VenueResponse` |
| PUT / DELETE | `/api/venues/{id}` | Admin | | `VenueResponse` / `204` |

## Admin

| Method | Path | Access | Body / params | Response |
|---|---|---|---|---|
| GET | `/api/admin/stats` | Admin | | users, organizers, organizations, events by status, registrations, check-ins, revenue, reviews, top 5 events |
| GET | `/api/admin/users` | Admin | `search?, role?, page, size` | `Page<UserResponse>` |
| PATCH | `/api/admin/users/{id}/role` | Admin | `{role}` | `UserResponse` (not yourself) |
| PATCH | `/api/admin/users/{id}/status` | Admin | `{enabled}` | `UserResponse` (not yourself) |

## Files

| Method | Path | Access | Body | Response |
|---|---|---|---|---|
| POST | `/api/files` | User | `multipart/form-data` field `file` (JPEG/PNG/WEBP/GIF ≤ 5 MB) | `201 {url: "/uploads/<uuid>.png", filename, size}` |
| GET | `/uploads/{filename}` | Public | | the image |

---

## Example session (curl)

```bash
# log in as the demo organizer
TOKEN=$(curl -s -X POST localhost:8080/api/auth/login -H 'Content-Type: application/json' \
  -d '{"email":"organizer@eventhub.tn","password":"Organizer@123"}' | jq -r .token)

# create a draft, add a free ticket, publish
EVENT=$(curl -s -X POST localhost:8080/api/events -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"title":"Meetup","categoryId":1,"venueId":1,"startDateTime":"2030-01-10T18:00","endDateTime":"2030-01-10T20:00","capacity":50}' | jq .id)
curl -s -X POST localhost:8080/api/events/$EVENT/ticket-types -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"name":"Free","price":0,"quantity":50}'
curl -s -X PATCH localhost:8080/api/events/$EVENT/publish -H "Authorization: Bearer $TOKEN"
```
