package hcl.smart.ticket.dto.request;

import hcl.smart.ticket.enums.TicketStatus;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record ChangeTicketStatusRequest(
		@NotNull TicketStatus status,
		@Size(max = 1000) String note) {
}
