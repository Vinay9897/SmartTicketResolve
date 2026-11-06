package hcl.smart.ticket.service;

import java.util.UUID;

import hcl.smart.ticket.dto.request.AddTicketCommentRequest;
import hcl.smart.ticket.dto.request.AssignTicketRequest;
import hcl.smart.ticket.dto.request.ChangeTicketStatusRequest;
import hcl.smart.ticket.dto.request.CreateTicketRequest;
import hcl.smart.ticket.dto.request.ResolveTicketRequest;
import hcl.smart.ticket.dto.response.PageResponse;
import hcl.smart.ticket.dto.response.TicketCommentResponse;
import hcl.smart.ticket.dto.response.TicketResponse;
import hcl.smart.ticket.enums.TicketPriority;
import hcl.smart.ticket.enums.TicketStatus;
import hcl.smart.ticket.security.UserPrincipal;
import org.springframework.data.domain.Pageable;

public interface TicketService {

	TicketResponse createTicket(UserPrincipal actor, CreateTicketRequest request);

	PageResponse<TicketResponse> findMyTickets(UserPrincipal actor, Pageable pageable);

	TicketResponse getTicket(UserPrincipal actor, UUID ticketId);

	TicketResponse getSupportTicket(UserPrincipal actor, UUID ticketId);

	TicketResponse getAdminTicket(UserPrincipal actor, UUID ticketId);

	PageResponse<TicketResponse> findSupportTickets(
			UserPrincipal actor, UUID categoryId, TicketPriority priority, TicketStatus status, Pageable pageable);

	PageResponse<TicketResponse> findAdminTickets(UserPrincipal actor, Pageable pageable);

	TicketResponse changeStatus(
			UserPrincipal actor, UUID ticketId, ChangeTicketStatusRequest request);

	TicketResponse assignTicket(UserPrincipal actor, UUID ticketId, AssignTicketRequest request);

	TicketResponse resolveTicket(UserPrincipal actor, UUID ticketId, ResolveTicketRequest request);

	TicketCommentResponse addComment(
			UserPrincipal actor, UUID ticketId, AddTicketCommentRequest request);

	PageResponse<TicketCommentResponse> getComments(
			UserPrincipal actor, UUID ticketId, Pageable pageable);
}
