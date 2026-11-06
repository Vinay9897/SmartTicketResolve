package hcl.smart.ticket.dto.response;

import java.time.Instant;
import java.util.UUID;

import hcl.smart.ticket.entity.Ticket;
import hcl.smart.ticket.enums.TicketPriority;
import hcl.smart.ticket.enums.TicketStatus;

public record TicketResponse(
		UUID id,
		String title,
		String description,
		String issueSummary,
		UUID categoryId,
		String categoryName,
		TicketPriority priority,
		TicketStatus status,
		UUID createdById,
		String createdByName,
		UUID assignedToId,
		String assignedToName,
		UUID supportTeamId,
		String supportTeamName,
		String resolutionNotes,
		Instant createdAt,
		Instant updatedAt,
		Instant resolvedAt) {

	public static TicketResponse from(Ticket ticket) {
		return new TicketResponse(
				ticket.getId(),
				ticket.getTitle(),
				ticket.getDescription(),
				ticket.getIssueSummary(),
				ticket.getCategory() == null ? null : ticket.getCategory().getId(),
				ticket.getCategory() == null ? null : ticket.getCategory().getName(),
				ticket.getPriority(),
				ticket.getStatus(),
				ticket.getCreatedBy().getId(),
				ticket.getCreatedBy().getName(),
				ticket.getAssignedTo() == null ? null : ticket.getAssignedTo().getId(),
				ticket.getAssignedTo() == null ? null : ticket.getAssignedTo().getName(),
				ticket.getSupportTeam() == null ? null : ticket.getSupportTeam().getId(),
				ticket.getSupportTeam() == null ? null : ticket.getSupportTeam().getName(),
				ticket.getResolutionNotes(),
				ticket.getCreatedAt(),
				ticket.getUpdatedAt(),
				ticket.getResolvedAt());
	}
}
