package hcl.smart.ticket.service;

import java.util.UUID;

import hcl.smart.ticket.entity.Ticket;
import hcl.smart.ticket.enums.UserRole;
import hcl.smart.ticket.repository.TeamMembershipRepository;
import hcl.smart.ticket.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class TicketAccessService {

	private final TeamMembershipRepository teamMembershipRepository;

	public void requireCanAccess(UserPrincipal user, Ticket ticket) {
		if (user == null || ticket == null) {
			throw new AccessDeniedException("Ticket access denied");
		}

		UserRole role = UserRole.valueOf(user.role());
		if (role == UserRole.ADMIN || isTicketOwner(user.id(), ticket)) {
			return;
		}

		if (role == UserRole.SUPPORT_ENGINEER && canEngineerAccess(user.id(), ticket)) {
			return;
		}

		throw new AccessDeniedException("Ticket access denied");
	}

	public boolean isTeamMember(UUID teamId, UUID userId) {
		return teamMembershipRepository.existsByTeamIdAndUserId(teamId, userId);
	}

	private boolean isTicketOwner(UUID userId, Ticket ticket) {
		return ticket.getCreatedBy() != null && userId.equals(ticket.getCreatedBy().getId());
	}

	private boolean canEngineerAccess(UUID userId, Ticket ticket) {
		if (ticket.getAssignedTo() != null && userId.equals(ticket.getAssignedTo().getId())) {
			return true;
		}
		if (ticket.getSupportTeam() != null
				&& teamMembershipRepository.existsByTeamIdAndUserId(ticket.getSupportTeam().getId(), userId)) {
			return true;
		}
		return ticket.getAssignedTo() == null && ticket.getSupportTeam() == null;
	}
}
