package hcl.smart.ticket.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ResolveTicketRequest(@NotBlank @Size(max = 20000) String resolutionNotes) {
}
