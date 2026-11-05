package hcl.smart.ticket.entity;

import java.time.Instant;
import java.util.UUID;

import hcl.smart.ticket.enums.TicketPriority;
import hcl.smart.ticket.enums.TicketStatus;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "tickets", indexes = {
		@Index(name = "idx_tickets_created_by_created_at", columnList = "created_by, created_at"),
		@Index(name = "idx_tickets_status_priority_created_at", columnList = "status, priority, created_at"),
		@Index(name = "idx_tickets_category_status", columnList = "category_id, status"),
		@Index(name = "idx_tickets_assigned_to_status", columnList = "assigned_to, status"),
		@Index(name = "idx_tickets_support_team_status", columnList = "support_team_id, status")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Ticket {

	@Id
	@GeneratedValue(strategy = GenerationType.UUID)
	private UUID id;

	@NotBlank
	@Size(max = 200)
	@Column(nullable = false, length = 200)
	private String title;

	@NotBlank
	@Column(nullable = false, columnDefinition = "text")
	private String description;

	@Column(columnDefinition = "text")
	private String issueSummary;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "category_id")
	private TicketCategory category;

	@NotNull
	@Enumerated(EnumType.STRING)
	@Column(nullable = false, length = 20)
	private TicketPriority priority;

	@NotNull
	@Enumerated(EnumType.STRING)
	@Column(nullable = false, length = 30)
	private TicketStatus status;

	@NotNull
	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "created_by", nullable = false)
	private User createdBy;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "assigned_to")
	private User assignedTo;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "support_team_id")
	private SupportTeam supportTeam;

	@Column(columnDefinition = "text")
	private String resolutionNotes;

	@NotNull
	@Builder.Default
	@Column(nullable = false, updatable = false)
	private Instant createdAt = Instant.now();

	@NotNull
	@Builder.Default
	@Column(nullable = false)
	private Instant updatedAt = Instant.now();

	private Instant resolvedAt;

	@PrePersist
	private void setCreationTimestamps() {
		Instant now = Instant.now();
		if (createdAt == null) {
			createdAt = now;
		}
		if (updatedAt == null) {
			updatedAt = now;
		}
	}

	@PreUpdate
	private void updateTimestamp() {
		updatedAt = Instant.now();
	}
}
