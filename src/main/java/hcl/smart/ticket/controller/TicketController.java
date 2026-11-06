package hcl.smart.ticket.controller;

import java.util.UUID;

import hcl.smart.ticket.dto.request.AddTicketCommentRequest;
import hcl.smart.ticket.dto.request.CreateTicketRequest;
import hcl.smart.ticket.dto.response.PageResponse;
import hcl.smart.ticket.dto.response.TicketCommentResponse;
import hcl.smart.ticket.dto.response.TicketResponse;
import hcl.smart.ticket.security.UserPrincipal;
import hcl.smart.ticket.service.TicketService;
import hcl.smart.ticket.util.PageableFactory;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/tickets")
@RequiredArgsConstructor
public class TicketController {

	private final TicketService ticketService;

	@PostMapping
	@ResponseStatus(HttpStatus.CREATED)
	public TicketResponse createTicket(
			@AuthenticationPrincipal UserPrincipal principal,
			@Valid @RequestBody CreateTicketRequest request) {
		return ticketService.createTicket(principal, request);
	}

	@GetMapping("/my")
	public PageResponse<TicketResponse> myTickets(
			@AuthenticationPrincipal UserPrincipal principal,
			@RequestParam(defaultValue = "0") int page,
			@RequestParam(defaultValue = "20") int size,
			@RequestParam(defaultValue = "createdAt") String sortBy,
			@RequestParam(defaultValue = "DESC") Sort.Direction direction) {
		return ticketService.findMyTickets(
				principal, PageableFactory.tickets(page, size, sortBy, direction));
	}

	@GetMapping("/{ticketId}")
	public TicketResponse getTicket(
			@AuthenticationPrincipal UserPrincipal principal,
			@PathVariable UUID ticketId) {
		return ticketService.getTicket(principal, ticketId);
	}

	@PostMapping("/{ticketId}/comments")
	@ResponseStatus(HttpStatus.CREATED)
	public TicketCommentResponse addComment(
			@AuthenticationPrincipal UserPrincipal principal,
			@PathVariable UUID ticketId,
			@Valid @RequestBody AddTicketCommentRequest request) {
		return ticketService.addComment(principal, ticketId, request);
	}

	@GetMapping("/{ticketId}/comments")
	public PageResponse<TicketCommentResponse> getComments(
			@AuthenticationPrincipal UserPrincipal principal,
			@PathVariable UUID ticketId,
			@RequestParam(defaultValue = "0") int page,
			@RequestParam(defaultValue = "20") int size) {
		return ticketService.getComments(principal, ticketId, PageableFactory.comments(page, size));
	}
}
