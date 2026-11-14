package hcl.smart.ticket.dto.response;

import java.util.List;

public record TicketDashboardSummary(
		long totalTickets,
		long openTickets,
		long inProgressTickets,
		long waitingForEmployeeTickets,
		long resolvedTickets,
		long closedTickets,
		List<DashboardCountResponse> ticketsBySupportTeam) {
}
