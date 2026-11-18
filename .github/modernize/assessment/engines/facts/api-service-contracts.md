# API & Service Communication Contracts

The application exposes 38 version-unprefixed REST endpoints through one backend process. Requests are synchronous HTTP calls; ticket creation also publishes an in-process post-commit event for optional AI analysis.

## Service Catalog

| Service | Port | Category | Purpose |
|---|---:|---|---|
| SmartResolve Backend (`ticket`) | 8080 (Spring Boot default) | API Layer / Business | Authentication, tickets, admin management, reporting, and AI analysis REST API |

## API Endpoints Inventory

| Service | Method | Path | Request Type | Response Type |
|---|---|---|---|---|
| AuthController | POST | `/api/auth/register` | `RegisterRequest` | `AuthResponse` |
| AuthController | POST | `/api/auth/login` | `LoginRequest` | `AuthResponse` |
| AuthController | GET | `/api/auth/me` | — | `UserResponse` |
| TicketController | POST | `/api/tickets` | `CreateTicketRequest` | `TicketResponse` |
| TicketController | GET | `/api/tickets/my` | page/size/sortBy/direction | `PageResponse<TicketResponse>` |
| TicketController | GET | `/api/tickets/{ticketId}` | ticketId | `TicketResponse` |
| TicketController | POST | `/api/tickets/{ticketId}/comments` | `AddTicketCommentRequest` | `TicketCommentResponse` |
| TicketController | GET | `/api/tickets/{ticketId}/comments` | ticketId/page/size | `PageResponse<TicketCommentResponse>` |
| TicketController | POST | `/api/tickets/{ticketId}/ai-analysis` | ticketId | `TicketAiAnalysisResponse` |
| TicketController | GET | `/api/tickets/{ticketId}/ai-analysis` | ticketId | `TicketAiAnalysisResponse` |
| SupportTicketController | GET | `/api/support/tickets` | page/size/sortBy/direction | `PageResponse<TicketResponse>` |
| SupportTicketController | GET | `/api/support/tickets/filter` | categoryId/priority/status + paging | `PageResponse<TicketResponse>` |
| SupportTicketController | GET | `/api/support/tickets/{ticketId}` | ticketId | `TicketResponse` |
| SupportTicketController | PUT | `/api/support/tickets/{ticketId}/status` | `ChangeTicketStatusRequest` | `TicketResponse` |
| SupportTicketController | PUT | `/api/support/tickets/{ticketId}/assign` | `AssignTicketRequest` | `TicketResponse` |
| SupportTicketController | PUT | `/api/support/tickets/{ticketId}/resolve` | `ResolveTicketRequest` | `TicketResponse` |
| SupportTicketController | PUT | `/api/support/tickets/{ticketId}/ai-analysis` | `ReviewTicketAiAnalysisRequest` | `TicketAiAnalysisResponse` |
| AdminTicketController | GET | `/api/admin/tickets` | page/size/sortBy/direction | `PageResponse<TicketResponse>` |
| AdminTicketController | GET | `/api/admin/tickets/{ticketId}` | ticketId | `TicketResponse` |
| AdminTicketController | PUT | `/api/admin/tickets/{ticketId}/assign` | `AssignTicketRequest` | `TicketResponse` |
| AdminUserController | GET | `/api/admin/users` | page/size/sortBy/direction | `PageResponse<UserResponse>` |
| AdminUserController | GET | `/api/admin/users/{id}` | id | `UserResponse` |
| AdminUserController | POST | `/api/admin/users` | `AdminCreateUserRequest` | `UserResponse` |
| AdminUserController | PUT | `/api/admin/users/{id}` | `AdminUpdateUserRequest` | `UserResponse` |
| AdminUserController | PATCH | `/api/admin/users/{id}/status` | `UpdateUserStatusRequest` | `UserResponse` |
| AdminCategoryController | POST | `/api/admin/categories` | `SaveNamedResourceRequest` | `NamedResourceResponse` |
| AdminCategoryController | GET | `/api/admin/categories` | — | `List<NamedResourceResponse>` |
| AdminCategoryController | PUT | `/api/admin/categories/{id}` | `SaveNamedResourceRequest` | `NamedResourceResponse` |
| AdminCategoryController | DELETE | `/api/admin/categories/{id}` | id | 204 |
| AdminTeamController | POST | `/api/admin/teams` | `SaveNamedResourceRequest` | `NamedResourceResponse` |
| AdminTeamController | GET | `/api/admin/teams` | — | `List<NamedResourceResponse>` |
| AdminTeamController | PUT | `/api/admin/teams/{id}` | `SaveNamedResourceRequest` | `NamedResourceResponse` |
| AdminTeamController | DELETE | `/api/admin/teams/{id}` | id | 204 |
| AdminDashboardController | GET | `/api/admin/dashboard/summary` | — | `TicketDashboardSummary` |
| AdminDashboardController | GET | `/api/admin/dashboard/tickets-by-status` | — | `List<DashboardCountResponse>` |
| AdminDashboardController | GET | `/api/admin/dashboard/tickets-by-priority` | — | `List<DashboardCountResponse>` |
| AdminDashboardController | GET | `/api/admin/dashboard/tickets-by-category` | — | `List<DashboardCountResponse>` |
| AdminDashboardController | GET | `/api/admin/dashboard/tickets-by-support-team` | — | `List<DashboardCountResponse>` |

## Management & Observability Endpoints

| Service | Endpoint | Custom Metrics |
|---|---|---|
| SmartResolve Backend | `GET /actuator/health` | None identified |
| SmartResolve Backend | `GET /actuator/info` | None identified |
| SmartResolve Backend | `GET /v3/api-docs`, `GET /swagger-ui.html` | None identified |

## DTOs & Contracts

API request/response contracts are Java records and serialize with Jackson. Principal DTOs include
`RegisterRequest`, `LoginRequest`, `AuthResponse`, `UserResponse`, `CreateTicketRequest`,
`TicketResponse`, `AssignTicketRequest`, `ChangeTicketStatusRequest`, `ResolveTicketRequest`,
`AddTicketCommentRequest`, `TicketCommentResponse`, `ReviewTicketAiAnalysisRequest`,
`TicketAiAnalysisResponse`, `SaveNamedResourceRequest`, `NamedResourceResponse`,
`PageResponse<T>`, `DashboardCountResponse`, `TicketDashboardSummary`, and `ApiErrorResponse`.
The backend is a single service; no gateway-level aggregation model exists. `TicketDashboardSummary`
is a backend reporting response aggregating status counts and support-team counts.

Springdoc is installed and supplies OpenAPI JSON at `/v3/api-docs` and Swagger UI at
`/swagger-ui.html`; no endpoint-level operation annotations were found. No protobuf or GraphQL
schema was found.

## Communication Patterns

- Browser/client-to-backend communication is synchronous REST over HTTP.
- Controllers call application services directly. Services use Spring Data JPA repositories.
- AI analysis is generated only after an employee explicitly requests it from ticket details.
  Ticket creation does not trigger an automatic AI call.
- AI calls use the configured Spring AI client. The analysis layer applies a configured timeout
  (default 20 seconds) and stores failed analysis status instead of undoing ticket creation.
- No retry or circuit-breaker configuration was found.
- No service discovery or API gateway was found.
- Authentication is stateless JWT bearer authentication; role checks and ticket ownership/team
  access checks are enforced. The repository does not establish an HTTPS/TLS termination policy.

## Service Technology Matrix

| Service | Web | Data Access | Discovery | Gateway | Actuator | Cache | Metrics |
|---|---|---|---|---|---|---|---|
| SmartResolve Backend | Spring MVC | Spring Data JPA | None | None | Health/info exposed | None found | None found |

## Service Communication Sequence

<!-- mermaid-checked: every participant uses `participant Id as "Label"`, no \n in aliases/messages/notes, every alt/opt/loop closed by end, no `:` inside any alias -->
~~~mermaid
sequenceDiagram
    participant Client as "Web Client"
    participant Security as "JWT Security"
    participant Controller as "REST Controller"
    participant Service as "Application Service"
    participant Database as "PostgreSQL"
    participant AI as "Spring AI Provider"

    Client->>Security: POST /api/auth/login
    Security->>Controller: Authenticate request
    Controller->>Service: LoginRequest
    Service->>Database: Find user and verify password
    Database-->>Service: User record
    Service-->>Client: AuthResponse with bearer token
    Client->>Security: POST /api/tickets with bearer token
    Security->>Controller: Authorized EMPLOYEE principal
    Controller->>Service: CreateTicketRequest
    Service->>Database: Save ticket and status history
    Database-->>Service: Persisted ticket
    Service-->>Client: TicketResponse
    Client->>Security: POST /api/tickets/{ticketId}/ai-analysis
    Security->>Controller: Authorized EMPLOYEE principal
    Controller->>Service: Generate analysis request
    Service->>Database: Save PENDING analysis
    Database-->>Service: Analysis context
    Service->>AI: Analyze title and description
    alt Provider responds
        AI-->>Service: Structured advisory analysis
        Service->>Database: Save COMPLETED analysis
        Database-->>Service: Saved analysis
    else Provider unavailable or timeout
        AI-->>Service: Provider failure
        Service->>Database: Save FAILED analysis
        Database-->>Service: Saved failed status
    end
    Service-->>Client: TicketAiAnalysisResponse
~~~
