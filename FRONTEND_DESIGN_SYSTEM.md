# SmartResolve UI/UX Design System

## Product direction

SmartResolve uses a calm, operational visual language: indigo establishes trust and primary
actions, slate neutrals keep ticket information readable, and semantic colors are reserved for
status and priority. White surfaces, compact borders, restrained shadows, and consistent spacing
create a premium enterprise feel without copying another service desk product.

The interface is data-led. Production totals, charts, activity, profile details, and ticket records
must come from authenticated backend responses, never hardcoded demo values. AI suggestions are
visually marked as provisional and kept separate from confirmed ticket properties.

## Color palette

| Token | Hex | Use |
|---|---|---|
| Brand 700 | `#3730A3` | Pressed/strong primary, active nav |
| Brand 600 | `#4F46E5` | Primary actions, links, focus accents |
| Brand 500 | `#6366F1` | Hover states and chart accent |
| Brand 50 | `#EEF2FF` | Selected navigation and soft brand surfaces |
| Canvas | `#F5F7FB` | Application background |
| Surface | `#FFFFFF` | Cards, menu panels, inputs |
| Text primary | `#0F172A` | Main headings and body content |
| Text secondary | `#475569` | Supporting labels |
| Text muted | `#64748B` | Hints and metadata |
| Border | `#E2E8F0` | Dividers, card and field outlines |
| Success | `#15803D` | Resolved/success states |
| Success soft | `#F0FDF4` | Success badges and notices |
| Warning | `#B45309` | Waiting and medium urgency |
| Warning soft | `#FFFBEB` | Warning badges and notices |
| Critical | `#B91C1C` | Critical priority and destructive feedback |
| Critical soft | `#FEF2F2` | Critical badges and notices |
| AI accent | `#7C3AED` | AI icon, recommendation border and label |
| AI soft | `#F5F3FF` | AI recommendation container |

Use semantic status colors consistently: OPEN uses blue, IN_PROGRESS uses indigo, and
WAITING_FOR_EMPLOYEE uses amber. RESOLVED uses green and CLOSED uses slate. Priority uses slate
for LOW, blue for MEDIUM, amber for HIGH, and red for CRITICAL. Do not rely on color alone; pair
color with visible status/priority text and, where useful, an icon.

## Typography and spacing

- Typeface: Inter, with `ui-sans-serif`, system sans-serif fallbacks.
- Base body: 14px / 1.5 line-height; compact metadata: 12px / 1.4.
- Page title: 24px / 1.25, semibold; section title: 16px / 1.4, semibold.
- Card metric: 28px / 1.1, semibold; form labels: 13px / 1.4, medium.
- Use a 4px spacing unit. Typical page padding is 24px desktop, 20px tablet, and 16px mobile.
- Use 8px control corner radius and 12px card radius. Shadows stay subtle; borders define
  structure.

## Component design guidelines

| Component | Guidance |
|---|---|
| Buttons | Primary indigo for the page's main action; secondary outlined, ghost for low emphasis, danger only for destructive actions. Include hover, active, focus-visible, disabled, and loading states. |
| Cards | White surface, 1px neutral border, 12px radius, 20-24px padding. Avoid nesting cards without a clear hierarchy. |
| Tables | Clear header labels, aligned values, compact 52-60px rows, visible row hover and keyboard focus. On narrow screens, allow horizontal scroll or use a designed list alternative. |
| Badges | Small text-first pills with semantic soft backgrounds. Use for status, priority, and AI labels. |
| Inputs | Persistent visible labels, 40-44px minimum height, visible focus ring, help/error text connected accessibly. |
| Dropdowns | Native keyboard behavior or equivalent; keep selected value and disabled states clear. |
| Modals | Focus stays in dialog; Escape closes when safe; backdrop is subtle; destructive confirmation names the action. |
| Sidebar | Fixed-width desktop rail with role-specific groups; active item uses brand-soft background and a leading indicator. Mobile uses an accessible drawer. |
| Header | Page context/breadcrumbs, global actions, profile control; keep height and actions consistent. |
| Breadcrumbs | Show current hierarchy, mark the final segment as current, and keep intermediate destinations links. |
| Charts | Use chart labels, legends/tooltips, and text alternatives. Empty and loading states are first-class. Charts supplement, not replace, ticket tables. |
| Empty states | Explain what is absent and offer a relevant next action when the user's role can perform it. |
| Loading skeletons | Match the eventual component geometry and support reduced motion. |
| Toasts | Announce success/error status accessibly; keep messages concise and dismissible. |

Common interaction timing is 120-180ms for hover/focus transitions. Respect
`prefers-reduced-motion`; avoid decorative animation and avoid gradients except for rare, subtle
brand accents.

## Dashboard wireframes

Wireframes communicate hierarchy and composition, not final copy or seeded values. Ticket counts
and charts are placeholders for live API data.

### Employee dashboard

```text
+------------------------------------------------------+-----------------------+
| SmartResolve / Sidebar       | Header: breadcrumb, search, profile             |
| Dashboard                    +------------------------------------------------+
| My Tickets                   | Welcome back, {name}             [Create ticket]|
| Create Ticket                |                                                 |
|                              | [Total] [Open] [In progress] [Resolved]        |
|                              |                                                 |
|                              | [Tickets by status chart] [Recent support      |
|                              |                              activity]         |
|                              |                                                 |
|                              | Recent tickets                                 |
|                              | ID | Subject | Status | Updated | Action         |
+------------------------------+------------------------------------------------+
```

Keep language plain and reassuring. Prioritize ticket visibility, next steps, and one obvious
create-ticket action over service-desk terminology.

### Support Engineer dashboard

```text
+------------------------------------------------------+-----------------------+
| SmartResolve / Sidebar       | Header: queue context, filters, profile         |
| Dashboard                    +------------------------------------------------+
| Ticket Queue                 | Support operations                [Refresh]     |
| Assigned Tickets             |                                                 |
|                              | [Incoming] [Unassigned] [Assigned] [High prio]  |
|                              | [In progress] [Resolved]                        |
|                              |                                                 |
|                              | Ticket queue                      [Filters]    |
|                              | Priority marker | Subject | Category | Owner    |
|                              | Status | Updated | Quick assign                 |
|                              |                                                 |
|                              | [Priority distribution] [Category distribution]|
|                              | Recently updated tickets                       |
+------------------------------+------------------------------------------------+
```

Use red only for critical tickets; high priority can use amber. Keep queue actions close to each
row but prevent accidental assignment with a clear assignee/team confirmation.

### Administrator dashboard

```text
+------------------------------------------------------+-----------------------+
| SmartResolve / Sidebar       | Header: Admin / date range / profile             |
| Dashboard                    +------------------------------------------------+
| Users                        | Administration overview                         |
| Categories                   |                                                 |
| Support Teams                | [Total tickets] [Open] [Resolved] [Total users]|
|                              |                                                 |
|                              | [Ticket trends over time] [Priority distribution]|
|                              |                                                 |
|                              | [Category distribution] [Support team workload]|
|                              |                                                 |
|                              | Recent activity / management shortcuts          |
+------------------------------+------------------------------------------------+
```

Ticket trends, total users, and recent activity require data not all supplied by the existing
dashboard endpoints. Do not render fabricated values; omit or clearly mark unavailable metrics
until backed by an API.

### Ticket details page

```text
+------------------------------------------------------+-----------------------+
| Sidebar                       | Header: Tickets / {ticketId} / profile          |
|                               +------------------------------------------------+
|                               | {Ticket title}                 [Status badge]  |
|                               | Category / priority / created / assigned       |
|                               +--------------------------------+---------------+
|                               | Description                    | Assignment    |
|                               |                                | Team / owner  |
|                               | Activity and comments          | Actions       |
|                               | Author / timestamp / text      |               |
|                               | [Comment input] [Send]         |               |
|                               +--------------------------------+---------------+
|                               | AI recommendation • Needs review               |
|                               | Summary | Suggested category | Priority       |
|                               | Troubleshooting steps | Suggested response  |
|                               |                         [Review and edit]       |
+-------------------------------+------------------------------------------------+
```

Keep the confirmed ticket status, category, priority, assignment, and resolution distinct from
AI-generated recommendations. Review controls are shown to support engineers only; the panel
should be visually secondary to the ticket and its conversation.

## Responsive layout guidelines

- Desktop (>= 1200px): 240-260px sidebar; content max width around 1440px; use 12-column dashboard
  grids. Keep detail context and assignment panel side by side where space permits.
- Tablet (768-1199px): collapse sidebar to icon rail or drawer; metrics in two columns; charts
  stack when labels become cramped.
- Mobile (< 768px): use a top bar with menu button and slide-in navigation; content uses 16px
  gutters; cards and forms become one column; ticket tables become horizontally scrollable or
  card lists; keep primary action reachable without covering content.
- Preserve logical reading/focus order at all widths. Do not use hover as the only way to expose
  actions.
- Minimum interactive target is 44x44 CSS pixels where practical. Maintain visible focus rings,
  adequate contrast, labels, and accessible names for icon-only buttons.

## Role navigation and page states

- Employee: Dashboard, My Tickets, Create Ticket.
- Support Engineer: Dashboard, Ticket Queue, Assigned Tickets.
- Administrator: Dashboard, Tickets, Users, Categories, Support Teams.
- AI generation follows the active role's API boundary: employees may generate through
  `/tickets/{ticketId}/ai-analysis`; support engineers can view and update existing
  recommendations but do not get a generation action. Never expose the employee generation
  endpoint from support UI.
- All roles: profile menu and logout. On mobile, role-specific navigation becomes a dismissible
  drawer with Escape and focus handling.
- Each data-backed screen has loading, empty, error, and success feedback states. Forms show
  inline validation and preserve user-entered values after recoverable errors.
- Do not display role-specific navigation as authorization. The backend remains the authorization
  source of truth.

## Current implementation scope

The React implementation provides the design tokens, responsive application shell, reusable UI
primitives, and role-aware dashboard previews. Dashboard metrics, charts, and ticket tables remain
empty until connected to authenticated backend data. The design-system route uses explicitly
labeled local sample tickets and chart values to demonstrate search, filters, pagination, badges,
legends, and tooltips; these samples are not production data. Other `/preview/*` routes remain
informational placeholders, and the role selector is for visual preview only, not authorization.
API integration should follow `FRONTEND_API_DOCUMENTATION.md`; its identified missing
category/team APIs must be addressed or handled explicitly before shipping those workflows.
