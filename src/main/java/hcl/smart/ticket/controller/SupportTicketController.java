package hcl.smart.ticket.controller;

import java.util.UUID;

import hcl.smart.ticket.dto.request.AssignTicketRequest;
import hcl.smart.ticket.dto.request.ChangeTicketStatusRequest;
import hcl.smart.ticket.dto.request.ResolveTicketRequest;
import hcl.smart.ticket.dto.response.PageResponse;
import hcl.smart.ticket.dto.response.TicketResponse;
import hcl.smart.ticket.enums.TicketPriority;
import hcl.smart.ticket.enums.TicketStatus;
import hcl.smart.ticket.security.UserPrincipal;
import hcl.smart.ticket.service.TicketService;
import hcl.smart.ticket.util.PageableFactory;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/support/tickets")
@RequiredArgsConstructor
public class SupportTicketController {

	private final TicketService ticketService;

	@GetMapping
	public PageResponse<TicketResponse> getTickets(
			@AuthenticationPrincipal UserPrincipal principal,
			@RequestParam(defaultValue = "0") int page,
			@RequestParam(defaultValue = "20") int size,
			@RequestParam(defaultValue = "createdAt") String sortBy,
			@RequestParam(defaultValue = "DESC") Sort.Direction direction) {
		return ticketService.findSupportTickets(principal, null, null, null,
				PageableFactory.tickets(page, size, sortBy, direction));
	}

	@GetMapping("/filter")
	public PageResponse<TicketResponse> filterTickets(
			@AuthenticationPrincipal UserPrincipal principal,
			@RequestParam(required = false) UUID categoryId,
			@RequestParam(required = false) TicketPriority priority,
			@RequestParam(required = false) TicketStatus status,
			@RequestParam(defaultValue = "0") int page,
			@RequestParam(defaultValue = "20") int size,
			@RequestParam(defaultValue = "createdAt") String sortBy,
			@RequestParam(defaultValue = "DESC") Sort.Direction direction) {
		return ticketService.findSupportTickets(principal, categoryId, priority, status,
				PageableFactory.tickets(page, size, sortBy, direction));
	}

	@GetMapping("/{ticketId}")
	public TicketResponse getTicket(
			@AuthenticationPrincipal UserPrincipal principal,
			@PathVariable UUID ticketId) {
		return ticketService.getSupportTicket(principal, ticketId);
	}

	@PutMapping("/{ticketId}/status")
	public TicketResponse changeStatus(
			@AuthenticationPrincipal UserPrincipal principal,
			@PathVariable UUID ticketId,
			@Valid @RequestBody ChangeTicketStatusRequest request) {
		return ticketService.changeStatus(principal, ticketId, request);
	}

	@PutMapping("/{ticketId}/assign")
	public TicketResponse assignTicket(
			@AuthenticationPrincipal UserPrincipal principal,
			@PathVariable UUID ticketId,
			@Valid @RequestBody AssignTicketRequest request) {
		return ticketService.assignTicket(principal, ticketId, request);
	}

	@PutMapping("/{ticketId}/resolve")
	public TicketResponse resolveTicket(
			@AuthenticationPrincipal UserPrincipal principal,
			@PathVariable UUID ticketId,
			@Valid @RequestBody ResolveTicketRequest request) {
		return ticketService.resolveTicket(principal, ticketId, request);
	}
}
