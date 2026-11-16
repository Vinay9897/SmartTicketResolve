# SmartResolve Backend API Contract for Frontend

This document records the backend contract observed in the current Spring controllers, DTOs,
security configuration, and service implementations. It describes 38 application REST endpoints;
paths are relative to the backend origin and there is no configured API context prefix.

## Authentication and shared conventions

- Protected API requests use `Authorization: Bearer <accessToken>`.
- `POST /api/auth/register` and `POST /api/auth/login` do not require a token. The OpenAPI UI,
  OpenAPI JSON, and health endpoint are also public.
- JWTs are stateless HS256 bearer tokens. The token response supplies `expiresIn` in seconds;
  configuration currently sets a 30-minute TTL. The token claims include `sub` (email),
  `userId`, and `role`.
- Exact roles: `EMPLOYEE`, `SUPPORT_ENGINEER`, `ADMIN`.
- URL security requires `ADMIN` for `/api/admin/**`, `SUPPORT_ENGINEER` for `/api/support/**`
  and `/api/engineer/**`; other API routes require authentication and apply further checks in
  their services.
- Timestamps are ISO-8601 instants. IDs are UUID strings.
- JSON request bodies use the DTO fields documented below. Invalid DTO validation normally
  returns HTTP 400.

### Common errors

Handled API errors have this shape:

```json
{
  "timestamp": "2026-01-01T12:00:00Z",
  "status": 400,
  "error": "Bad Request",
  "message": "Request validation failed",
  "path": "/api/..."
}
```

The concrete response type is `ApiErrorResponse(timestamp, status, error, message, path)`.
Common statuses:

| HTTP | Meaning |
|---|---|
| 400 | DTO validation or invalid paging/sort input |
| 401 | Missing/invalid authentication or failed login |
| 403 | Authenticated role or ticket access not permitted |
| 404 | Ticket, user, category, team, or analysis does not exist |
| 409 | Duplicate email/name, invalid ticket operation/transition, or unavailable AI review |
| 500 | Authentication service failure; other unhandled server failures use framework handling |

## DTOs and response shapes

All records below are immutable Java records; JSON uses their declared component names.

### Authentication and user

- `RegisterRequest`: `name`, `email`, `password`.
- `LoginRequest`: `email`, `password`.
- `AuthResponse`: `accessToken`, `tokenType` (`Bearer`), `expiresIn` (seconds), `user`.
- `UserResponse`: `id`, `name`, `email`, `role`, `active`, `createdAt`. Passwords/hashes are not
  exposed.
- `AdminCreateUserRequest`: `name`, `email`, `password`, `role`.
- `AdminUpdateUserRequest`: `name`, `email`, `role`, optional `password`. When provided, a
  nonblank password replaces the existing password hash.
- `UpdateUserStatusRequest`: `active`.

### Ticket, comment, and AI analysis

- `CreateTicketRequest`: required `title` (max 200) and `description` (max 20,000), optional
  `categoryId`, optional `priority`. When omitted, priority defaults to `MEDIUM` and no category
  is assigned.
- `TicketResponse`: `id`, `title`, `description`, `issueSummary`, `categoryId`, `categoryName`,
  `priority`, `status`, `createdById`, `createdByName`, `assignedToId`, `assignedToName`,
  `supportTeamId`, `supportTeamName`, `resolutionNotes`, `createdAt`, `updatedAt`, `resolvedAt`.
  Nullable properties may be JSON `null`.
- `AssignTicketRequest`: `assignedToId` (required), optional `supportTeamId`.
- `ChangeTicketStatusRequest`: `status` (required), optional `note`.
- `ResolveTicketRequest`: `resolutionNotes`.
- `AddTicketCommentRequest`: `comment`, optional `visibility` (`PUBLIC` or `INTERNAL`).
- `TicketCommentResponse`: `id`, `ticketId`, `userId`, `userName`, `comment`, `visibility`,
  `createdAt`.
- `TicketAiAnalysisResponse`: `id`, `ticketId`, `suggestedCategoryName`, `suggestedCategoryId`,
  `suggestedPriority`, `issueSummary`, `troubleshootingSteps` (string array), `suggestedResponse`,
  `reviewedById`, `reviewedAt`, `status`, `createdAt`, and `failureMessage` (nullable).
- `TicketStatusHistoryResponse`: `id`, `ticketId`, `fromStatus`, `toStatus`, `note`,
  `changedByName`, and `changedAt`.
- `AssignableEngineerResponse` and `AssignableTeamResponse`: `id` and `name`.
- `ReviewTicketAiAnalysisRequest`: `issueSummary`, `suggestedCategoryId`, `suggestedPriority`,
  `troubleshootingSteps` (string array), `suggestedResponse`.
- AI analysis status values: `PENDING`, `COMPLETED`, `FAILED`, `REVIEWED`. AI output is advisory;
  it does not itself assign or transition a ticket.

### Catalog, pagination, and dashboard

- `SaveNamedResourceRequest`: `name`, optional `description`, optional `active`.
  Create always sets `active=true`; update applies `active` only if supplied.
- `NamedResourceResponse`: `id`, `name`, `description`, `active`.
- `PageResponse<T>`: `content`, `page`, `size`, `totalElements`, `totalPages`, `first`, `last`.
- `DashboardCountResponse`: `key`, `id`, `name`, `count`.
- `TicketDashboardSummary`: `totalTickets`, `openTickets`, `inProgressTickets`,
  `waitingForEmployeeTickets`, `resolvedTickets`, `closedTickets`, `ticketsBySupportTeam`.
- Dashboard count `key` values are `status`, `priority`, `category`, or `supportTeam`; nullable
  `id` is used for synthetic groups such as `Uncategorized` and `Unassigned`.

## API endpoint inventory

`Body` refers to the DTO above. A dash means no request body. Unless otherwise stated, successful
reads and updates return HTTP 200.

### Authentication

| Method and path | Parameters / body | Success response | Authentication / role | Errors |
|---|---|---|---|---|
| `POST /api/auth/register` | Body: `RegisterRequest` | 201 `AuthResponse` (new public accounts are `EMPLOYEE`) | Public | 400 invalid input/password, 409 email exists |
| `POST /api/auth/login` | Body: `LoginRequest` | 200 `AuthResponse` | Public | 400 invalid input, 401 bad credentials/inactive user |
| `GET /api/auth/me` | — | 200 `UserResponse` | Any authenticated user | 401 |

### Employee/common ticket APIs

The ticket owner can access their own ticket. Support engineers can access tickets assigned to them,
their team, or the unassigned queue. Administrators can access any ticket. Employees see only public
comments; support engineers and administrators can see internal comments when they have ticket
access.

| Method and path | Parameters / body | Success response | Authentication / role | Errors |
|---|---|---|---|---|
| `POST /api/tickets` | Body: `CreateTicketRequest` | 201 `TicketResponse`; initial status is `OPEN`, default priority `MEDIUM`; automatic AI analysis is enabled by default | `EMPLOYEE` | 400 invalid input, 403 other role/inactive category, 404 category |
| `GET /api/tickets/my` | Query: `page=0`, `size=20`, `sortBy=createdAt`, `direction=DESC` | 200 `PageResponse<TicketResponse>` | `EMPLOYEE` | 400 invalid paging/sort |
| `GET /api/tickets/{ticketId}` | Path: UUID `ticketId` | 200 `TicketResponse` | Authenticated; service enforces ticket access | 403, 404 |
| `POST /api/tickets/{ticketId}/comments` | Path `ticketId`; body `AddTicketCommentRequest` | 201 `TicketCommentResponse` | Ticket participant with access; employee may add `PUBLIC` only | 400, 403, 404, 409 closed ticket or internal employee comment |
| `GET /api/tickets/{ticketId}/comments` | Path `ticketId`; query `page=0`, `size=20` | 200 `PageResponse<TicketCommentResponse>`; sorted `createdAt` ascending | Ticket participant with access | 400, 403, 404 |
| `POST /api/tickets/{ticketId}/ai-analysis` | Path `ticketId`; no body | 201 `TicketAiAnalysisResponse` | Authenticated user with ticket access | 403, 404; provider failure is returned as analysis status `FAILED` |
| `GET /api/tickets/{ticketId}/ai-analysis` | Path `ticketId` | 200 latest `TicketAiAnalysisResponse` | Authenticated user with ticket access | 403, 404 if ticket or analysis is missing |

Ticket list sort fields accepted by both ticket and admin ticket lists are `createdAt`, `updatedAt`,
`priority`, `status`, and `title`. `page` must be non-negative; `size` must be 1 through 100.

### Support engineer APIs

The URL group is role-restricted to `SUPPORT_ENGINEER`. Ticket-specific operations also enforce
ticket/team/queue access in the service. Assignment requires an active support engineer and, when a
team is supplied, team membership. Closed tickets cannot be assigned or changed.

| Method and path | Parameters / body | Success response | Authentication / role | Errors |
|---|---|---|---|---|
| `GET /api/support/tickets` | Query: `page=0`, `size=20`, `sortBy=createdAt`, `direction=DESC` | 200 `PageResponse<TicketResponse>` | `SUPPORT_ENGINEER` | 400 invalid paging/sort |
| `GET /api/support/tickets/filter` | Optional query `categoryId`, `priority`, `status`; plus common ticket paging/sorting | 200 `PageResponse<TicketResponse>` | `SUPPORT_ENGINEER` | 400 invalid enum/paging/sort |
| `GET /api/support/tickets/{ticketId}` | Path `ticketId` | 200 `TicketResponse` | `SUPPORT_ENGINEER` with ticket access | 403, 404 |
| `GET /api/support/tickets/{ticketId}/status-history` | Path `ticketId`; query `page=0`, `size=100` | 200 `PageResponse<TicketStatusHistoryResponse>` | `SUPPORT_ENGINEER` with ticket access | 400, 403, 404 |
| `PUT /api/support/tickets/{ticketId}/status` | Path `ticketId`; body `ChangeTicketStatusRequest` | 200 `TicketResponse` | `SUPPORT_ENGINEER` with ticket access | 400, 403, 404, 409 invalid transition/closed ticket |
| `PUT /api/support/tickets/{ticketId}/assign` | Path `ticketId`; body `AssignTicketRequest` | 200 `TicketResponse` | `SUPPORT_ENGINEER` with ticket access | 400, 403, 404, 409 invalid assignee/team/closed ticket |
| `PUT /api/support/tickets/{ticketId}/resolve` | Path `ticketId`; body `ResolveTicketRequest` | 200 `TicketResponse` with `RESOLVED` status | `SUPPORT_ENGINEER` with ticket access | 400, 403, 404, 409 already resolved/closed |
| `PUT /api/support/tickets/{ticketId}/ai-analysis` | Path `ticketId`; body `ReviewTicketAiAnalysisRequest` | 200 `TicketAiAnalysisResponse` | `SUPPORT_ENGINEER` with ticket access | 400, 403, 404, 409 analysis not completed/category unavailable |
| `GET /api/support/assignment-options/engineers` | Optional query `teamId` | 200 array of `AssignableEngineerResponse` | `SUPPORT_ENGINEER` | 403 |
| `GET /api/support/assignment-options/teams` | — | 200 array of `AssignableTeamResponse` | `SUPPORT_ENGINEER` | 403 |

For the support queue, category, priority, and status filters use the corresponding query parameters
on `GET /api/support/tickets/filter`; creation-date ordering uses `sortBy=createdAt` and
`direction=ASC|DESC`. The API has no ticket title/ID search parameter, so the queue UI searches the
accessible results client-side. Support category choices are derived from accessible ticket data
because `GET /api/admin/categories` is administrator-only.

Allowed ticket statuses are `OPEN`, `IN_PROGRESS`, `WAITING_FOR_EMPLOYEE`, `RESOLVED`, `CLOSED`.
Transitions are validated in the service; resolution uses the separate `/resolve` operation with
required notes. `CLOSED` is only reachable by closing a resolved ticket with resolution notes.

### Administrator ticket APIs

| Method and path | Parameters / body | Success response | Authentication / role | Errors |
|---|---|---|---|---|
| `GET /api/admin/tickets` | Query: common ticket paging/sorting | 200 `PageResponse<TicketResponse>` | `ADMIN` | 400 invalid paging/sort |
| `GET /api/admin/tickets/{ticketId}` | Path `ticketId` | 200 `TicketResponse` | `ADMIN` | 404 |
| `PUT /api/admin/tickets/{ticketId}/assign` | Path `ticketId`; body `AssignTicketRequest` | 200 `TicketResponse` | `ADMIN` | 400, 404, 409 invalid assignee/team/closed ticket |

The admin ticket list has no category, priority, or status filter parameters in the current
controller.

### Administrator user management

`page` defaults to 0; `size` defaults to 20 and is limited to 1 through 100. User `sortBy` accepts
`createdAt`, `updatedAt`, `name`, `email`, `role`, `active`; `direction` defaults to `DESC`.

| Method and path | Parameters / body | Success response | Authentication / role | Errors |
|---|---|---|---|---|
| `GET /api/admin/users` | Query: `page`, `size`, `sortBy`, `direction`, optional `search` (name/email), optional `role` (`EMPLOYEE`, `SUPPORT_ENGINEER`, `ADMIN`) | 200 `PageResponse<UserResponse>` | `ADMIN` | 400 invalid paging/sort/role |
| `GET /api/admin/users/{id}` | Path UUID `id` | 200 `UserResponse` | `ADMIN` | 404 |
| `POST /api/admin/users` | Body: `AdminCreateUserRequest` | 201 `UserResponse` | `ADMIN` | 400 invalid input/password, 409 duplicate email |
| `PUT /api/admin/users/{id}` | Path `id`; body `AdminUpdateUserRequest` | 200 `UserResponse` | `ADMIN` | 400 invalid input/password, 404, 409 duplicate email |
| `PATCH /api/admin/users/{id}/status` | Path `id`; body `UpdateUserStatusRequest` | 200 `UserResponse` | `ADMIN` | 400 invalid input, 404 |

### Administrator category and support team management

Both resource collections use `SaveNamedResourceRequest` for create/update, and return
`NamedResourceResponse`. Duplicate names are checked case-insensitively. DELETE deactivates the
resource (does not physically remove it), returning 204. A PUT can reactivate it by including
`"active": true`.

| Method and path | Parameters / body | Success response | Authentication / role | Errors |
|---|---|---|---|---|
| `POST /api/admin/categories` | Body: `SaveNamedResourceRequest` | 201 `NamedResourceResponse` | `ADMIN` | 400 invalid input, 409 duplicate name |
| `GET /api/admin/categories` | — | 200 array of `NamedResourceResponse`, includes inactive categories | `ADMIN` | 403 |
| `PUT /api/admin/categories/{id}` | Path UUID `id`; body `SaveNamedResourceRequest` | 200 `NamedResourceResponse` | `ADMIN` | 400, 404, 409 duplicate name |
| `DELETE /api/admin/categories/{id}` | Path `id` | 204, no body | `ADMIN` | 404 |
| `POST /api/admin/teams` | Body: `SaveNamedResourceRequest` | 201 `NamedResourceResponse` | `ADMIN` | 400 invalid input, 409 duplicate name |
| `GET /api/admin/teams` | — | 200 array of `NamedResourceResponse`, includes inactive teams | `ADMIN` | 403 |
| `PUT /api/admin/teams/{id}` | Path UUID `id`; body `SaveNamedResourceRequest` | 200 `NamedResourceResponse` | `ADMIN` | 400, 404, 409 duplicate name |
| `DELETE /api/admin/teams/{id}` | Path `id` | 204, no body | `ADMIN` | 404 |

### Administrator dashboard and reporting

All reporting endpoints require `ADMIN`. `DashboardCountResponse` entries use `key`, nullable `id`,
`name`, and `count`.

| Method and path | Parameters / body | Success response | Authentication / role | Errors |
|---|---|---|---|---|
| `GET /api/admin/dashboard/summary` | — | 200 `TicketDashboardSummary` | `ADMIN` | 403 |
| `GET /api/admin/dashboard/tickets-by-status` | — | 200 array of `DashboardCountResponse` | `ADMIN` | 403 |
| `GET /api/admin/dashboard/tickets-by-priority` | — | 200 array of `DashboardCountResponse` | `ADMIN` | 403 |
| `GET /api/admin/dashboard/tickets-by-category` | — | 200 array of `DashboardCountResponse` | `ADMIN` | 403 |
| `GET /api/admin/dashboard/tickets-by-support-team` | — | 200 array of `DashboardCountResponse` | `ADMIN` | 403 |

Status values returned include all `TicketStatus` enum values, including `WAITING_FOR_EMPLOYEE`.
Priority counts include all priorities. Category reporting includes a synthetic `Uncategorized`
row. Team reporting includes a synthetic `Unassigned` row for tickets with no support team set.
These counts are database aggregates; summary has status totals and embeds the support-team count
list. It does not embed priority/category lists.

### Management, health, and API documentation

| Method and path | Parameters / body | Success response | Authentication |
|---|---|---|---|
| `GET /actuator/health` | — | Spring Boot health response | Public |
| `GET /actuator/info` | — | Spring Boot info response when configured | Authenticated (only health is explicitly public) |
| `GET /v3/api-docs` | — | Springdoc OpenAPI JSON | Public |
| `GET /swagger-ui.html` | — | Swagger UI | Public |

Springdoc is included and configured as API version `v1`; controllers do not define per-operation
OpenAPI annotations. These paths are observed from Springdoc/Security configuration and actuator
exposure, not controller methods.

## Screen-to-API mapping

| Role / screen | API calls |
|---|---|
| Sign in / registration | `POST /api/auth/login` or `POST /api/auth/register`; each returns `AuthResponse` including the user profile. `GET /api/auth/me` is available for authenticated profile retrieval. |
| Employee dashboard | `GET /api/tickets/my` (fetch paginated results to calculate complete ticket totals and status counts); `GET /api/tickets/{ticketId}/comments` for comments on the five most recently updated tickets |
| Employee ticket list | `GET /api/tickets/my` |
| Employee ticket submission | `POST /api/tickets`; category and priority are optional (default priority is `MEDIUM`); category selection is omitted because no non-admin category-list API exists |
| Employee ticket detail / comments | `GET /api/tickets/{ticketId}`; `GET /api/tickets/{ticketId}/comments`; `POST /api/tickets/{ticketId}/comments`; the frontend retrieves `GET /api/tickets/{ticketId}/ai-analysis` to display analysis generated automatically on creation |
| Employee AI analysis | `POST /api/tickets/{ticketId}/ai-analysis`; `GET /api/tickets/{ticketId}/ai-analysis` |
| Support dashboard | `GET /api/support/tickets` across pages; dashboard metrics, priority chart, and assigned-ticket summary are computed from the accessible results |
| Support queue / filters | `GET /api/support/tickets`; `GET /api/support/tickets/filter`; the Assigned Tickets screen filters the accessible results by the signed-in engineer's `assignedToId` because no assigned-only endpoint exists |
| Support ticket detail / conversation | `GET /api/support/tickets/{ticketId}`; shared ticket comment GET/POST endpoints |
| Support ticket work | `GET /api/support/assignment-options/engineers`; `GET /api/support/assignment-options/teams`; `GET /api/support/tickets/{ticketId}/status-history`; `PUT /api/support/tickets/{ticketId}/assign`; `/status`; `/resolve` |
| Support AI recommendation review | `GET /api/tickets/{ticketId}/ai-analysis`; `PUT /api/support/tickets/{ticketId}/ai-analysis` |
| Admin dashboard | `GET /api/admin/dashboard/summary`; `/tickets-by-status`; `/tickets-by-priority`; `/tickets-by-category`; support-team counts are included in `summary.ticketsBySupportTeam` (the separate `/tickets-by-support-team` endpoint is available but not used by this screen) |
| Admin ticket browsing / assignment | `GET /api/admin/tickets`; `GET /api/admin/tickets/{ticketId}`; `PUT /api/admin/tickets/{ticketId}/assign`; active engineer options from `GET /api/admin/users?role=SUPPORT_ENGINEER`; active team options from `GET /api/admin/teams` |
| Admin user management | `/api/admin/users` GET/POST; `/api/admin/users/{id}` GET/PUT; `/api/admin/users/{id}/status` PATCH |
| Admin category management | `/api/admin/categories` GET/POST; `/api/admin/categories/{id}` PUT/DELETE |
| Admin team management | `/api/admin/teams` GET/POST; `/api/admin/teams/{id}` PUT/DELETE |

## Frontend authentication integration notes

- The frontend validates the returned `AuthResponse` and stores only the short-lived access
  token and its expiry in tab-scoped `sessionStorage`; passwords and user profiles are not
  persisted. Because browser storage is readable by JavaScript, this remains exposed to XSS.
- After a page refresh, the frontend verifies the stored token through `GET /api/auth/me` before
  restoring the user or rendering protected routes. The role used for routing comes from that
  response, not from stored browser data.
- Session expiry is calculated from the response's `expiresIn` value. Expired/invalid sessions
  and protected-request 401s clear the saved session, while a 403 displays an access-restricted
  state. Frontend role checks are UX controls only; backend authorization remains authoritative.
- Local development uses `VITE_API_BASE_URL=/api` and the Vite proxy target in
  `SMARTRESOLVE_BACKEND_PROXY_TARGET` (default `http://localhost:8080`). The backend currently
  has no CORS configuration, so production deployments should use a same-origin reverse proxy
  or configure CORS for the deployed frontend origin.

## Contract gaps and frontend implications

These are absences or limitations observed in the current backend, not proposed endpoints:

1. There is no employee/support-facing category list. `GET /api/admin/categories` is admin-only,
   although employees can optionally send `categoryId` when creating a ticket and support queues
   can filter by `categoryId`.
2. There is no support team membership management API. Assignment validates that an engineer is a
   member of a selected team, but the admin frontend cannot manage memberships through REST.
3. There is no team/category member detail endpoint; team/category list responses expose only
   `id`, `name`, `description`, and `active`.
4. Admin ticket listing is paginated but not filterable by category, priority, or status.
5. Registration only creates `EMPLOYEE`; role selection and account administration are available
   only to an authenticated admin through user management.
6. User comments are readable by ticket participants, but there is no comments pagination sorting
   option other than ascending creation time.
7. There is no separately exposed endpoint for AI analysis history; GET returns only the latest
   analysis.

## Enums used by the API

- `UserRole`: `EMPLOYEE`, `SUPPORT_ENGINEER`, `ADMIN`.
- `TicketStatus`: `OPEN`, `IN_PROGRESS`, `WAITING_FOR_EMPLOYEE`, `RESOLVED`, `CLOSED`.
- `TicketPriority`: `LOW`, `MEDIUM`, `HIGH`, `CRITICAL`.
- `CommentVisibility`: `PUBLIC`, `INTERNAL`.
- `AiAnalysisStatus`: `PENDING`, `COMPLETED`, `FAILED`, `REVIEWED`.
