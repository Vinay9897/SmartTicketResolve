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

`TicketAccessService` provides service-layer owner, team-membership, and unassigned-queue checks
for future ticket operations. Ticket endpoints and business workflows remain out of scope here.
