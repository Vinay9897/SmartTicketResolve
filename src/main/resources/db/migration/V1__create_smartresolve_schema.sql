CREATE TABLE users (
    id UUID PRIMARY KEY,
    name VARCHAR(160) NOT NULL,
    email VARCHAR(254) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CONSTRAINT users_role_check CHECK (role IN ('EMPLOYEE', 'ENGINEER', 'ADMIN')),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
    CONSTRAINT uk_users_email UNIQUE (email)
);

CREATE INDEX idx_users_role_active ON users (role, active);

CREATE TABLE ticket_categories (
    id UUID PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description VARCHAR(500),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT uk_ticket_categories_name UNIQUE (name)
);

CREATE INDEX idx_ticket_categories_active ON ticket_categories (active);

CREATE TABLE support_teams (
    id UUID PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description VARCHAR(500),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT uk_support_teams_name UNIQUE (name)
);

CREATE INDEX idx_support_teams_active ON support_teams (active);

CREATE TABLE team_memberships (
    id UUID PRIMARY KEY,
    team_id UUID NOT NULL,
    user_id UUID NOT NULL,
    joined_at TIMESTAMP WITH TIME ZONE NOT NULL,
    CONSTRAINT uk_team_memberships_team_user UNIQUE (team_id, user_id),
    CONSTRAINT fk_team_memberships_team FOREIGN KEY (team_id) REFERENCES support_teams (id),
    CONSTRAINT fk_team_memberships_user FOREIGN KEY (user_id) REFERENCES users (id)
);

CREATE INDEX idx_team_memberships_user ON team_memberships (user_id);

CREATE TABLE tickets (
    id UUID PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    issue_summary TEXT,
    category_id UUID,
    priority VARCHAR(20) NOT NULL CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    status VARCHAR(30) NOT NULL CHECK (
        status IN ('OPEN', 'IN_PROGRESS', 'WAITING_FOR_EMPLOYEE', 'RESOLVED', 'CLOSED')
    ),
    created_by UUID NOT NULL,
    assigned_to UUID,
    support_team_id UUID,
    resolution_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
    resolved_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT fk_tickets_category FOREIGN KEY (category_id) REFERENCES ticket_categories (id),
    CONSTRAINT fk_tickets_created_by FOREIGN KEY (created_by) REFERENCES users (id),
    CONSTRAINT fk_tickets_assigned_to FOREIGN KEY (assigned_to) REFERENCES users (id),
    CONSTRAINT fk_tickets_support_team FOREIGN KEY (support_team_id) REFERENCES support_teams (id)
);

CREATE INDEX idx_tickets_created_by_created_at ON tickets (created_by, created_at);
CREATE INDEX idx_tickets_status_priority_created_at ON tickets (status, priority, created_at);
CREATE INDEX idx_tickets_category_status ON tickets (category_id, status);
CREATE INDEX idx_tickets_assigned_to_status ON tickets (assigned_to, status);
CREATE INDEX idx_tickets_support_team_status ON tickets (support_team_id, status);

CREATE TABLE ticket_comments (
    id UUID PRIMARY KEY,
    ticket_id UUID NOT NULL,
    user_id UUID NOT NULL,
    comment VARCHAR(10000) NOT NULL,
    visibility VARCHAR(10) NOT NULL DEFAULT 'PUBLIC' CHECK (visibility IN ('PUBLIC', 'INTERNAL')),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    CONSTRAINT fk_ticket_comments_ticket FOREIGN KEY (ticket_id) REFERENCES tickets (id),
    CONSTRAINT fk_ticket_comments_user FOREIGN KEY (user_id) REFERENCES users (id)
);

CREATE INDEX idx_ticket_comments_ticket_created_at ON ticket_comments (ticket_id, created_at);

CREATE TABLE ticket_assignments (
    id UUID PRIMARY KEY,
    ticket_id UUID NOT NULL,
    assigned_by UUID,
    assigned_to UUID NOT NULL,
    support_team_id UUID,
    assigned_at TIMESTAMP WITH TIME ZONE NOT NULL,
    CONSTRAINT fk_ticket_assignments_ticket FOREIGN KEY (ticket_id) REFERENCES tickets (id),
    CONSTRAINT fk_ticket_assignments_assigned_by FOREIGN KEY (assigned_by) REFERENCES users (id),
    CONSTRAINT fk_ticket_assignments_assigned_to FOREIGN KEY (assigned_to) REFERENCES users (id),
    CONSTRAINT fk_ticket_assignments_support_team FOREIGN KEY (support_team_id) REFERENCES support_teams (id)
);

CREATE INDEX idx_ticket_assignments_ticket_assigned_at ON ticket_assignments (ticket_id, assigned_at);
CREATE INDEX idx_ticket_assignments_assigned_to ON ticket_assignments (assigned_to);

CREATE TABLE ticket_status_history (
    id UUID PRIMARY KEY,
    ticket_id UUID NOT NULL,
    changed_by UUID,
    from_status VARCHAR(30) CHECK (
        from_status IS NULL OR from_status IN ('OPEN', 'IN_PROGRESS', 'WAITING_FOR_EMPLOYEE', 'RESOLVED', 'CLOSED')
    ),
    to_status VARCHAR(30) NOT NULL CHECK (
        to_status IN ('OPEN', 'IN_PROGRESS', 'WAITING_FOR_EMPLOYEE', 'RESOLVED', 'CLOSED')
    ),
    note VARCHAR(1000),
    changed_at TIMESTAMP WITH TIME ZONE NOT NULL,
    CONSTRAINT fk_ticket_status_history_ticket FOREIGN KEY (ticket_id) REFERENCES tickets (id),
    CONSTRAINT fk_ticket_status_history_user FOREIGN KEY (changed_by) REFERENCES users (id)
);

CREATE INDEX idx_ticket_status_history_ticket_changed_at ON ticket_status_history (ticket_id, changed_at);

CREATE TABLE ticket_ai_analyses (
    id UUID PRIMARY KEY,
    ticket_id UUID NOT NULL,
    suggested_category_id UUID,
    suggested_priority VARCHAR(20) CHECK (
        suggested_priority IS NULL OR suggested_priority IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')
    ),
    issue_summary TEXT,
    troubleshooting_steps TEXT,
    suggested_response TEXT,
    reviewed_by UUID,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (
        status IN ('PENDING', 'COMPLETED', 'FAILED', 'REVIEWED')
    ),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    CONSTRAINT fk_ticket_ai_analyses_ticket FOREIGN KEY (ticket_id) REFERENCES tickets (id),
    CONSTRAINT fk_ticket_ai_analyses_category FOREIGN KEY (suggested_category_id) REFERENCES ticket_categories (id),
    CONSTRAINT fk_ticket_ai_analyses_reviewer FOREIGN KEY (reviewed_by) REFERENCES users (id)
);

CREATE INDEX idx_ticket_ai_analyses_ticket_created_at ON ticket_ai_analyses (ticket_id, created_at);
