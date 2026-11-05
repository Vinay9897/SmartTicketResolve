package hcl.smart.ticket.entity;

import java.time.Instant;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "ticket_assignments", indexes = {
		@Index(name = "idx_ticket_assignments_ticket_assigned_at", columnList = "ticket_id, assigned_at"),
		@Index(name = "idx_ticket_assignments_assigned_to", columnList = "assigned_to")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TicketAssignment {

	@Id
	@GeneratedValue(strategy = GenerationType.UUID)
	private UUID id;

	@NotNull
	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "ticket_id", nullable = false)
	private Ticket ticket;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "assigned_by")
	private User assignedBy;

	@NotNull
	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "assigned_to", nullable = false)
	private User assignedTo;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "support_team_id")
	private SupportTeam supportTeam;

	@NotNull
	@Builder.Default
	@Column(nullable = false, updatable = false)
	private Instant assignedAt = Instant.now();
}
