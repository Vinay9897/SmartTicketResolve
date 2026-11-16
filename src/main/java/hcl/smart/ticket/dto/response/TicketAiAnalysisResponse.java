package hcl.smart.ticket.dto.response;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import hcl.smart.ticket.enums.AiAnalysisStatus;
import hcl.smart.ticket.enums.TicketPriority;

public record TicketAiAnalysisResponse(
		UUID id,
		UUID ticketId,
		String suggestedCategoryName,
		UUID suggestedCategoryId,
		TicketPriority suggestedPriority,
		String issueSummary,
		List<String> troubleshootingSteps,
		String suggestedResponse,
		UUID reviewedById,
		Instant reviewedAt,
		AiAnalysisStatus status,
		Instant createdAt,
		String failureMessage) {
}
