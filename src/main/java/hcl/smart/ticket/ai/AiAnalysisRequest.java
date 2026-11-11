package hcl.smart.ticket.ai;

import java.util.List;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record AiAnalysisRequest(
		@NotBlank @Size(max = 200) String title,
		@NotBlank @Size(max = 20000) String description,
		@NotNull List<@NotBlank @Size(max = 100) String> allowedCategories) {
}
