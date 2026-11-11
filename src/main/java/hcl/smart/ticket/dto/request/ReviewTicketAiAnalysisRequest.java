package hcl.smart.ticket.dto.request;

import java.util.List;
import java.util.UUID;

import hcl.smart.ticket.enums.TicketPriority;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record ReviewTicketAiAnalysisRequest(
		@NotBlank @Size(max = 1000) String issueSummary,
		@NotNull UUID suggestedCategoryId,
		@NotNull TicketPriority suggestedPriority,
		@NotEmpty @Size(max = 8) List<@NotBlank @Size(max = 1000) String> troubleshootingSteps,
		@NotBlank @Size(max = 2000) String suggestedResponse) {
}
