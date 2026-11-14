package hcl.smart.ticket.service;

import java.util.ArrayList;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import hcl.smart.ticket.dto.response.DashboardCountResponse;
import hcl.smart.ticket.dto.response.TicketDashboardSummary;
import hcl.smart.ticket.enums.TicketPriority;
import hcl.smart.ticket.enums.TicketStatus;
import hcl.smart.ticket.repository.TicketRepository;
import hcl.smart.ticket.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class TicketDashboardService {

	private final TicketRepository ticketRepository;
	private final AdminAuthorizationService authorizationService;

	@Transactional(readOnly = true)
	public TicketDashboardSummary summary(UserPrincipal actor) {
		authorizationService.requireAdmin(actor);
		Map<TicketStatus, Long> counts = statusCounts();
		List<DashboardCountResponse> byTeam = ticketsBySupportTeamInternal();
		long total = counts.values().stream().mapToLong(Long::longValue).sum();
		return new TicketDashboardSummary(
				total,
				counts.getOrDefault(TicketStatus.OPEN, 0L),
				counts.getOrDefault(TicketStatus.IN_PROGRESS, 0L),
				counts.getOrDefault(TicketStatus.WAITING_FOR_EMPLOYEE, 0L),
				counts.getOrDefault(TicketStatus.RESOLVED, 0L),
				counts.getOrDefault(TicketStatus.CLOSED, 0L),
				byTeam);
	}

	@Transactional(readOnly = true)
	public List<DashboardCountResponse> ticketsByStatus(UserPrincipal actor) {
		authorizationService.requireAdmin(actor);
		Map<TicketStatus, Long> counts = statusCounts();
		return java.util.Arrays.stream(TicketStatus.values())
				.map(status -> new DashboardCountResponse("status", null, status.name(),
						counts.getOrDefault(status, 0L)))
				.toList();
	}

	@Transactional(readOnly = true)
	public List<DashboardCountResponse> ticketsByPriority(UserPrincipal actor) {
		authorizationService.requireAdmin(actor);
		Map<TicketPriority, Long> counts = new EnumMap<>(TicketPriority.class);
		for (Object[] row : ticketRepository.countTicketsByPriority()) {
			counts.put((TicketPriority) row[0], ((Number) row[1]).longValue());
		}
		return java.util.Arrays.stream(TicketPriority.values())
				.map(priority -> new DashboardCountResponse("priority", null, priority.name(),
						counts.getOrDefault(priority, 0L)))
				.toList();
	}

	@Transactional(readOnly = true)
	public List<DashboardCountResponse> ticketsByCategory(UserPrincipal actor) {
		authorizationService.requireAdmin(actor);
		List<DashboardCountResponse> counts = ticketRepository.countTicketsByCategory().stream()
				.map(row -> new DashboardCountResponse(
						"category",
						(UUID) row[0],
						(String) row[1],
						((Number) row[2]).longValue()))
				.collect(java.util.stream.Collectors.toCollection(ArrayList::new));
		counts.add(new DashboardCountResponse("category", null, "Uncategorized",
				ticketRepository.countByCategoryIsNull()));
		return counts;
	}

	@Transactional(readOnly = true)
	public List<DashboardCountResponse> ticketsBySupportTeam(UserPrincipal actor) {
		authorizationService.requireAdmin(actor);
		return ticketsBySupportTeamInternal();
	}

	private Map<TicketStatus, Long> statusCounts() {
		Map<TicketStatus, Long> counts = new EnumMap<>(TicketStatus.class);
		for (Object[] row : ticketRepository.countTicketsByStatus()) {
			counts.put((TicketStatus) row[0], ((Number) row[1]).longValue());
		}
		return counts;
	}

	private List<DashboardCountResponse> ticketsBySupportTeamInternal() {
		List<DashboardCountResponse> counts = ticketRepository.countTicketsBySupportTeam().stream()
				.map(row -> new DashboardCountResponse(
						"supportTeam",
						(UUID) row[0],
						(String) row[1],
						((Number) row[2]).longValue()))
				.collect(java.util.stream.Collectors.toCollection(ArrayList::new));
		counts.add(new DashboardCountResponse("supportTeam", null, "Unassigned",
				ticketRepository.countBySupportTeamIsNull()));
		return counts;
	}
}
