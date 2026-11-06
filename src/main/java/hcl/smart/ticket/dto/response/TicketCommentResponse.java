package hcl.smart.ticket.dto.response;

import java.time.Instant;
import java.util.UUID;

import hcl.smart.ticket.entity.TicketComment;
import hcl.smart.ticket.enums.CommentVisibility;

public record TicketCommentResponse(
		UUID id,
		UUID ticketId,
		UUID userId,
		String userName,
		String comment,
		CommentVisibility visibility,
		Instant createdAt) {

	public static TicketCommentResponse from(TicketComment ticketComment) {
		return new TicketCommentResponse(
				ticketComment.getId(),
				ticketComment.getTicket().getId(),
				ticketComment.getUser().getId(),
				ticketComment.getUser().getName(),
				ticketComment.getComment(),
				ticketComment.getVisibility(),
				ticketComment.getCreatedAt());
	}
}
