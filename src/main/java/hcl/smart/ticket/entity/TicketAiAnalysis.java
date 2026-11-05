package hcl.smart.ticket.entity;

import java.time.Instant;
import java.util.UUID;

import hcl.smart.ticket.enums.AiAnalysisStatus;
import hcl.smart.ticket.enums.TicketPriority;
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
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "ticket_ai_analyses", indexes = {
		@Index(name = "idx_ticket_ai_analyses_ticket_created_at", columnList = "ticket_id, created_at")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TicketAiAnalysis {

	@Id
	@GeneratedValue(strategy = GenerationType.UUID)
	private UUID id;

	@NotNull
	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "ticket_id", nullable = false)
	private Ticket ticket;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "suggested_category_id")
	private TicketCategory suggestedCategory;

	@Enumerated(EnumType.STRING)
	@Column(length = 20)
	private TicketPriority suggestedPriority;

	@Column(columnDefinition = "text")
	private String issueSummary;

	@Column(columnDefinition = "text")
	private String troubleshootingSteps;

	@Column(columnDefinition = "text")
	private String suggestedResponse;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "reviewed_by")
	private User reviewedBy;

	private Instant reviewedAt;

	@NotNull
	@Builder.Default
	@Enumerated(EnumType.STRING)
	@Column(nullable = false, length = 20)
	private AiAnalysisStatus status = AiAnalysisStatus.PENDING;

	@NotNull
	@Builder.Default
	@Column(nullable = false, updatable = false)
	private Instant createdAt = Instant.now();
}
