# EventHub Frontend

Angular 19 single-page application for the EventHub Spring Boot API. It covers public event discovery,
ticket registration with QR codes, organizer workspaces (events, ticket types, attendees, check-in,
team, organization settings) and an administration console.

## Requirements

- Node.js 20 or newer, npm 10 or newer
- The EventHub backend running on `http://localhost:8080` for development (see `proxy.conf.json`)
- Google Chrome or Chromium for the unit tests

## Install and run

```bash
npm ci
npm start            # ng serve on http://localhost:4200, proxies /api and /uploads to :8080
```

Demo accounts come from the backend `DataSeeder` (see the backend README). Do not hard-code credentials in
the frontend; the login form reads what the user types.

## Build

```bash
npm run build                                  # production build (output in dist/event/browser)
npx ng build --configuration development       # development build with source maps
```

Production is served from the same origin as the API (nginx proxies `/api` and `/uploads`), so the
API base URL stays empty. See `.env.example` for every setting and where it lives.

## Tests

```bash
CHROME_BIN=$PWD/scripts/test-chrome.sh npx ng test --watch=false --browsers=ChromeHeadless
```

`scripts/test-chrome.sh` starts Chrome with `--no-sandbox`, which is required when running as root or in
containers. On a normal workstation, `CHROME_BIN` can point straight at Chrome.

Current suite: 20 unit tests covering the API helpers, query-string building, error normalization, the
AuthService session lifecycle, route guards, HTTP interceptors, the TND pipe, date helpers and the
open-redirect guard on the login return URL.

## Project structure

```
src/app/
  core/           API config, models (typed DTO mirrors), auth (AuthService, MembershipService),
                  guards, interceptors, HTTP services (one per backend controller area)
  shared/         design-system UI components, domain components (event card, venue form), pipes, utils
  layout/         application shell: sidebar, top bar, notification polling
  features/
    auth/         login, register
    home/         landing page
    events/       event list (URL-bound filters), event detail (registration, reviews)
    organizations/ public organization directory and profile
    venues/       public venue directory
    account/      profile, my tickets, my reviews, notifications
    organizer/    setup, dashboard, events, event form, event management, check-in, team, settings
    admin/        dashboard, users, organizations, categories, venues
    not-found/
```

Routes are lazy loaded. Guards are a UX convenience only: every rule is enforced again by the API.

## Configuration

| Setting | Where | Default |
| --- | --- | --- |
| API base URL | `src/environments/environment*.ts` (`apiBaseUrl`) | `''` (same origin) |
| Dev proxy target | `proxy.conf.json` | `http://localhost:8080` |
| Upload limit (client check) | `core/services/file.service.ts` | 5 MB, JPEG/PNG/WEBP/GIF |

## Authentication

- Login returns a JWT (`expiresIn` is milliseconds). The session is stored in `localStorage` under
  `eventhub.session` and restored at startup by calling `GET /api/auth/me`.
- The auth interceptor adds `Authorization: Bearer` to API requests only.
- A 401 from any protected endpoint signs the user out and returns to `/login?expired=1&returnUrl=...`.
  Credential endpoints (login, register) do not trigger this.
- Organizer areas depend on `GET /api/organizations/me` (membership status and staff role). Approved
  moderators and organizers can manage events, check-in staff can scan tickets, and volunteers only
  view their organization.

## Features

- Discovery: search, category/city/date filters, free-only, past events, sorting, pagination; filters are
  kept in the URL so searches can be shared.
- Events: details, ticket types with availability, registration, cancellation, reviews (create/edit/delete).
- Tickets: my tickets with QR codes, cancellation, status filters.
- Account: profile and photo, password change, my reviews, notifications (read, read all, delete).
- Organizations and venues: public directories and profiles.
- Organizer: create an organization or request to join, dashboard stats, event creation and editing
  with server-side validation messages, publish/cancel/delete, ticket type management, attendee list with
  payment confirmation and CSV export, check-in by scanner, typed code or camera (where BarcodeDetector is
  supported), team approval and roles, organization settings and deletion.
- Admin: platform statistics, user search with role and access changes, organization verification and
  deletion, category and venue management.
- Common states: skeletons while loading, error states with retry, empty states, toast feedback, confirm
  dialogs for destructive actions, responsive layout with a drawer navigation below 960 px.

## API endpoints used

All 70 HTTP calls in the app were checked against the backend controllers (method and path, with path
variables normalized). Query parameter names were checked against the `@RequestParam` declarations.

Auth: `POST /api/auth/login`, `POST /api/auth/register`, `GET /api/auth/me`
Users: `GET|PUT /api/users/me`, `PUT /api/users/me/password`
Events: `GET /api/events`, `POST /api/events`, `GET /api/events/organization/me`, `GET|PUT|DELETE /api/events/{id}`,
`PATCH /api/events/{id}/publish`, `PATCH /api/events/{id}/cancel`, `GET /api/events/{id}/stats`
Ticket types: `GET|POST /api/events/{id}/ticket-types`, `GET|PUT|DELETE /api/ticket-types/{id}`
Registrations: `POST /api/registrations`, `GET /api/registrations/me`, `GET /api/registrations/{id}`,
`PATCH /api/registrations/{id}/cancel`, `PATCH /api/registrations/{id}/confirm`,
`POST /api/registrations/check-in`, `GET /api/registrations/event/{id}`, `GET /api/registrations/event/{id}/me`,
`GET /api/registrations/event/{id}/export`
Reviews: `POST /api/reviews`, `GET /api/reviews/me`, `GET /api/reviews/event/{id}`, `PUT|DELETE /api/reviews/{id}`
Organizations: `GET|POST /api/organizations`, `GET|PUT|DELETE /api/organizations/{id}`, `GET /api/organizations/me`,
`GET /api/organizations/me/stats`, `POST /api/organizations/{id}/join`, `PATCH /api/organizations/{id}/verify`,
staff under `/api/organizations/{id}/staff` (list, add, approve, reject, role, remove)
Venues: `GET|POST /api/venues`, `GET /api/venues/cities`, `GET|PUT|DELETE /api/venues/{id}`
Categories: `GET|POST /api/categories`, `GET|PUT|DELETE /api/categories/{id}`
Notifications: `GET /api/notifications`, `GET /api/notifications/unread-count`, `PATCH /api/notifications/read-all`,
`PATCH /api/notifications/{id}/read`, `DELETE /api/notifications/{id}`
Admin: `GET /api/admin/stats`, `GET /api/admin/users`, `PATCH /api/admin/users/{id}/role`,
`PATCH /api/admin/users/{id}/status`
Files: `POST /api/files`

## Verification status and known limits

- **Backend not run here.** Maven Central was unreachable from the build environment, so the Spring Boot
  application was not compiled or started. The API integration is verified statically against the
  controllers and `docs/API.md`, not end to end. Run the app against a real backend before release.
- **Frontend build and tests pass**: development and production builds compile with no warnings, and the
  20 unit tests pass. Screenshots were checked for the login page, the events page and the organizations
  page at 1280 and 390 px, but only with no backend running (error and empty states). Data-bearing screens
  were not visually verified.
- **Notifications** are polled every 60 seconds; the API has no push channel.
- **Organizer event list** is loaded in one request and filtered, sorted and paged in the browser, because
  the endpoint is not paginated.
- **Admin review listing** is not available in the API, so reviews are only visible per event.
- **Admin organization list** uses the public, unpaginated endpoint.
- **Camera scanning** needs the browser's BarcodeDetector API (Chromium-based browsers). Other browsers use
  a USB/Bluetooth scanner or manual code entry.
- **Token storage**: the JWT is kept in `localStorage` for session restore. Serve the app over HTTPS and keep
  a strict Content-Security-Policy in production.
- **Payment** is recorded by organizers (confirm payment action); no payment provider is integrated.
