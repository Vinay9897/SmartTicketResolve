package hcl.smart.ticket.controller;

import java.util.List;

import hcl.smart.ticket.dto.response.DashboardCountResponse;
import hcl.smart.ticket.dto.response.TicketDashboardSummary;
import hcl.smart.ticket.security.UserPrincipal;
import hcl.smart.ticket.service.TicketDashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/dashboard")
@RequiredArgsConstructor
public class AdminDashboardController {

	private final TicketDashboardService dashboardService;

	@GetMapping("/summary")
	public TicketDashboardSummary getSummary(@AuthenticationPrincipal UserPrincipal principal) {
		return dashboardService.summary(principal);
	}

	@GetMapping("/tickets-by-status")
	public List<DashboardCountResponse> getTicketsByStatus(@AuthenticationPrincipal UserPrincipal principal) {
		return dashboardService.ticketsByStatus(principal);
	}

	@GetMapping("/tickets-by-priority")
	public List<DashboardCountResponse> getTicketsByPriority(@AuthenticationPrincipal UserPrincipal principal) {
		return dashboardService.ticketsByPriority(principal);
	}

	@GetMapping("/tickets-by-category")
	public List<DashboardCountResponse> getTicketsByCategory(@AuthenticationPrincipal UserPrincipal principal) {
		return dashboardService.ticketsByCategory(principal);
	}

	@GetMapping("/tickets-by-support-team")
	public List<DashboardCountResponse> getTicketsByTeam(@AuthenticationPrincipal UserPrincipal principal) {
		return dashboardService.ticketsBySupportTeam(principal);
	}
}
