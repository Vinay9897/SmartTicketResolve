package hcl.smart.ticket.controller;

import java.util.UUID;

import hcl.smart.ticket.dto.response.PageResponse;
import hcl.smart.ticket.dto.response.TicketResponse;
import hcl.smart.ticket.security.UserPrincipal;
import hcl.smart.ticket.service.TicketService;
import hcl.smart.ticket.util.PageableFactory;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/tickets")
@RequiredArgsConstructor
public class AdminTicketController {

	private final TicketService ticketService;

	@GetMapping
	public PageResponse<TicketResponse> getTickets(
			@AuthenticationPrincipal UserPrincipal principal,
			@RequestParam(defaultValue = "0") int page,
			@RequestParam(defaultValue = "20") int size,
			@RequestParam(defaultValue = "createdAt") String sortBy,
			@RequestParam(defaultValue = "DESC") Sort.Direction direction) {
		return ticketService.findAdminTickets(
				principal, PageableFactory.tickets(page, size, sortBy, direction));
	}

	@GetMapping("/{ticketId}")
	public TicketResponse getTicket(
			@AuthenticationPrincipal UserPrincipal principal,
			@PathVariable UUID ticketId) {
		return ticketService.getAdminTicket(principal, ticketId);
	}
}
