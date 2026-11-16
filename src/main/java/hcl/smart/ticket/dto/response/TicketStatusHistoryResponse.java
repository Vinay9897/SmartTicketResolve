package hcl.smart.ticket.dto.response;

import java.time.Instant;
import java.util.UUID;

import hcl.smart.ticket.enums.TicketStatus;

public record TicketStatusHistoryResponse(
		UUID id,
		UUID ticketId,
		TicketStatus fromStatus,
		TicketStatus toStatus,
		String note,
		String changedByName,
		Instant changedAt) {
}
