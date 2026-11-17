package hcl.smart.ticket.service;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

import hcl.smart.ticket.dto.request.AssignSupportTeamMembersRequest;
import hcl.smart.ticket.dto.response.SupportTeamMemberResponse;
import hcl.smart.ticket.dto.response.SupportTeamOverviewResponse;
import hcl.smart.ticket.entity.SupportTeam;
import hcl.smart.ticket.entity.TeamMembership;
import hcl.smart.ticket.entity.User;
import hcl.smart.ticket.enums.UserRole;
import hcl.smart.ticket.exception.TicketNotFoundException;
import hcl.smart.ticket.exception.TicketOperationException;
import hcl.smart.ticket.exception.InvalidRequestException;
import hcl.smart.ticket.repository.SupportTeamRepository;
import hcl.smart.ticket.repository.TeamMembershipRepository;
import hcl.smart.ticket.repository.UserRepository;
import hcl.smart.ticket.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class SupportTeamMembershipService {

	private final SupportTeamRepository supportTeamRepository;
	private final TeamMembershipRepository teamMembershipRepository;
	private final UserRepository userRepository;
	private final AdminAuthorizationService authorizationService;

	@Transactional(readOnly = true)
	public List<SupportTeamOverviewResponse> getTeamOverviews(UserPrincipal actor) {
		authorizationService.requireAdmin(actor);
		return supportTeamRepository.findAllTeamOverviews();
	}

	@Transactional(readOnly = true)
	public List<SupportTeamMemberResponse> getTeamMembers(UserPrincipal actor, UUID teamId) {
		authorizationService.requireAdmin(actor);
		findTeam(teamId);
		return teamMembershipRepository.findAllByTeamIdWithUserOrderByUserName(teamId).stream()
				.map(SupportTeamMemberResponse::from)
				.toList();
	}

	@Transactional
	public List<SupportTeamMemberResponse> assignMembers(
			UserPrincipal actor, UUID teamId, AssignSupportTeamMembersRequest request) {
		authorizationService.requireAdmin(actor);
		SupportTeam team = findTeam(teamId);
		if (!team.isActive()) {
			throw new TicketOperationException("Inactive support teams cannot receive new members");
		}

		List<UUID> engineerIds = request.engineerIds();
		Set<UUID> uniqueEngineerIds = new HashSet<>(engineerIds);
		if (uniqueEngineerIds.size() != engineerIds.size()) {
			throw new InvalidRequestException("Each support engineer can only be listed once");
		}

		List<User> engineers = userRepository.findAllById(uniqueEngineerIds);
		if (engineers.size() != uniqueEngineerIds.size()) {
			throw new TicketNotFoundException();
		}
		for (User engineer : engineers) {
			if (engineer.getRole() != UserRole.SUPPORT_ENGINEER || !engineer.isActive()) {
				throw new TicketOperationException("Only active support engineers can be assigned to a team");
			}
			if (teamMembershipRepository.existsByTeamIdAndUserId(teamId, engineer.getId())) {
				throw new TicketOperationException("A selected support engineer is already assigned to this team");
			}
		}

		teamMembershipRepository.saveAll(engineers.stream()
				.map(engineer -> TeamMembership.builder().team(team).user(engineer).build())
				.toList());
		return teamMembershipRepository.findAllByTeamIdWithUserOrderByUserName(teamId).stream()
				.map(SupportTeamMemberResponse::from)
				.toList();
	}

	@Transactional
	public void unassignMember(UserPrincipal actor, UUID teamId, UUID engineerId) {
		authorizationService.requireAdmin(actor);
		findTeam(teamId);
		TeamMembership membership = teamMembershipRepository.findByTeamIdAndUserId(teamId, engineerId)
				.orElseThrow(TicketNotFoundException::new);
		teamMembershipRepository.delete(membership);
	}

	private SupportTeam findTeam(UUID teamId) {
		return supportTeamRepository.findById(teamId).orElseThrow(TicketNotFoundException::new);
	}
}
