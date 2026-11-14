# SmartResolve Backend

## Requirements

- Java 21
- Maven (or the included Maven wrapper)
- PostgreSQL

## Local configuration

The application reads the database URL, username, password, and JWT signing secret from
`SMARTRESOLVE_DB_URL`, `SMARTRESOLVE_DB_USERNAME`, `SMARTRESOLVE_DB_PASSWORD`, and
`SMARTRESOLVE_JWT_SECRET`. A JWT secret is mandatory and must contain at least 32 UTF-8 bytes.
Access tokens expire after 15 minutes by default; configure
`smartresolve.security.jwt.access-token-ttl` with a Java duration if needed.

Flyway migrations are loaded from `src/main/resources/db/migration`. JPA schema generation is
disabled; Hibernate validates the schema at startup.

## Build and run

```powershell
.\mvnw.cmd test
.\mvnw.cmd spring-boot:run
```

Swagger UI is available at `/swagger-ui.html`; health is available at `/actuator/health`.

## Authentication API

- `POST /api/auth/register` creates an active `EMPLOYEE` account and returns a JWT.
- `POST /api/auth/login` authenticates an active account and returns a JWT.
- `GET /api/auth/me` returns the authenticated user profile.

Send protected requests with `Authorization: Bearer <access-token>`. New public registrations
cannot choose a role. Passwords are stored as BCrypt hashes; password input is limited to 72
UTF-8 bytes to match BCrypt's input limit. Admin and support-engineer URL groups are role
protected. Authentication reloads the account on each request so inactive accounts and role
changes invalidate previously issued tokens.

## Ticket API

- `POST /api/tickets` creates an `OPEN` ticket for the authenticated employee.
- `GET /api/tickets/my` returns the employee's paginated tickets.
- `GET /api/tickets/{ticketId}` and the ticket comment routes enforce ticket access.
- `/api/support/tickets` provides the support engineer's assigned, team, or unassigned queue,
  with status/category/priority filtering, assignment, status transitions, and resolution.
- `/api/admin/tickets` provides admin-wide paginated ticket reads.
- `PUT /api/admin/tickets/{ticketId}/assign` lets administrators assign/reassign an active support
  engineer, optionally paired with a team the engineer belongs to.
- `/api/admin/users` provides paginated user management. Passwords are BCrypt-hashed and never
  included in responses; an optional password on user update replaces the current hash.
- `/api/admin/categories` and `/api/admin/teams` provide catalog management. Deleting a category
  or team deactivates it to preserve ticket and assignment history; PUT can reactivate it with
  `"active": true`.
- `/api/admin/dashboard/summary` returns ticket totals, status totals, and support-team totals.
  `/api/admin/dashboard/tickets-by-status`, `/tickets-by-priority`, `/tickets-by-category`, and
  `/tickets-by-support-team` return database-aggregated counts, including uncategorized and
  unassigned tickets.

Ticket list endpoints accept `page`, `size` (maximum 100), `sortBy` (`createdAt`, `updatedAt`,
`priority`, `status`, or `title`), and `direction`. Support filtering accepts `categoryId`,
`priority`, and `status`.

Tickets begin in `OPEN` with `MEDIUM` priority unless a priority is supplied. Resolution notes are
required to resolve; closing is allowed only from `RESOLVED`. Closed tickets cannot be assigned,
changed, or commented on. Status transitions and assignment changes are recorded in history.
Employee comments are always public; engineers can add internal comments. Ticket access checks
are enforced in the service layer in addition to URL role checks.
Assignment history records the ticket, assigning user, assigned engineer, optional support team,
and timestamp for each assignment or reassignment.

## AI Ticket Analysis

For local development, store the HCL AI Cafe subscription key in the root-level
`application-local.properties` file:

```properties
smartresolve.ai.api-key=your-ai-cafe-key
```

This file is Git-ignored and loaded as an optional Spring configuration override. Do not force-add
it to Git. You can also provide the key through `SMARTRESOLVE_AI_API_KEY` in deployed environments.
The default endpoint is the `gpt-4.1` deployment with API version `2024-12-01-preview`; override it
with `SMARTRESOLVE_AI_ENDPOINT` if needed. `SMARTRESOLVE_AI_MODEL` defaults to `gpt-4.1`,
`SMARTRESOLVE_AI_TEMPERATURE` defaults to `0.2`, and `SMARTRESOLVE_AI_REQUEST_TIMEOUT` defaults
to `PT20S`. Each AI response is capped at 100 tokens. Without a configured API key, analyses are
recorded as `FAILED`; ticket creation still succeeds. Set
`SMARTRESOLVE_AI_AUTO_ANALYZE_ON_CREATE=false` to disable automatic after-creation analysis.

- `POST /api/tickets/{ticketId}/ai-analysis` requests a new analysis.
- `GET /api/tickets/{ticketId}/ai-analysis` returns the latest analysis.
- `PUT /api/support/tickets/{ticketId}/ai-analysis` lets an authorized support engineer review and
  update a completed analysis.

AI recommendations are advisory. They do not assign, resolve, or close tickets. Category
recommendations are checked against active categories when any are configured. The V3 Flyway
migration adds a text label so recommendations can still be retained when they do not map to a
configured category.
