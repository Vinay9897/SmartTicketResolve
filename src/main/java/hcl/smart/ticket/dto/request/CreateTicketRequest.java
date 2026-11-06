package hcl.smart.ticket.dto.request;

import java.util.UUID;

import hcl.smart.ticket.enums.TicketPriority;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateTicketRequest(
		@NotBlank @Size(max = 200) String title,
		@NotBlank @Size(max = 20000) String description,
		UUID categoryId,
		TicketPriority priority) {
}
