package hcl.smart.ticket.dto.request;

import hcl.smart.ticket.enums.CommentVisibility;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record AddTicketCommentRequest(
		@NotBlank @Size(max = 10000) String comment,
		CommentVisibility visibility) {
}
