package hcl.smart.ticket.mapper;

import hcl.smart.ticket.dto.response.TicketCommentResponse;
import hcl.smart.ticket.dto.response.TicketResponse;
import hcl.smart.ticket.entity.Ticket;
import hcl.smart.ticket.entity.TicketComment;
import org.springframework.stereotype.Component;

@Component
public class TicketMapper {

	public TicketResponse toResponse(Ticket ticket) {
		return TicketResponse.from(ticket);
	}

	public TicketCommentResponse toCommentResponse(TicketComment comment) {
		return TicketCommentResponse.from(comment);
	}
}
