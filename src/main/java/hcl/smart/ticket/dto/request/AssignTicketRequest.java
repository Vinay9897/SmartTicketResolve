package hcl.smart.ticket.dto.request;

import java.util.UUID;

import jakarta.validation.constraints.NotNull;

public record AssignTicketRequest(
		@NotNull UUID assignedToId,
		UUID supportTeamId) {
}
