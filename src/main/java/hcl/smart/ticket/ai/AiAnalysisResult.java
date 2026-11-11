package hcl.smart.ticket.ai;

import java.util.List;

import hcl.smart.ticket.enums.TicketPriority;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record AiAnalysisResult(
		@NotBlank @Size(max = 1000) String issueSummary,
		@NotBlank @Size(max = 100) String suggestedCategory,
		@NotNull TicketPriority suggestedPriority,
		@NotEmpty @Size(max = 8) List<@NotBlank @Size(max = 1000) String> troubleshootingSteps,
		@NotBlank @Size(max = 2000) String suggestedResponse) {
}
