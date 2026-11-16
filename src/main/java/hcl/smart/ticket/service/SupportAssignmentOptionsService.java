package hcl.smart.ticket.service;

import java.util.List;
import java.util.UUID;

import hcl.smart.ticket.dto.response.AssignableEngineerResponse;
import hcl.smart.ticket.dto.response.AssignableTeamResponse;
import hcl.smart.ticket.enums.UserRole;
import hcl.smart.ticket.repository.SupportTeamRepository;
import hcl.smart.ticket.repository.UserRepository;
import hcl.smart.ticket.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class SupportAssignmentOptionsService {

	private final UserRepository userRepository;
	private final SupportTeamRepository supportTeamRepository;

	@Transactional(readOnly = true)
	public List<AssignableEngineerResponse> getAvailableEngineers(UserPrincipal actor, UUID teamId) {
		requireSupportEngineer(actor);
		return userRepository.findActiveSupportEngineersForTeam(UserRole.SUPPORT_ENGINEER, teamId)
				.stream()
				.map(AssignableEngineerResponse::from)
				.toList();
	}

	@Transactional(readOnly = true)
	public List<AssignableTeamResponse> getAvailableTeams(UserPrincipal actor) {
		requireSupportEngineer(actor);
		return supportTeamRepository.findAllByActiveTrueOrderByNameAsc()
				.stream()
				.map(AssignableTeamResponse::from)
				.toList();
	}

	private void requireSupportEngineer(UserPrincipal actor) {
		if (actor == null
				|| !UserRole.SUPPORT_ENGINEER.name().equals(actor.role())) {
			throw new AccessDeniedException("Support engineer access is required");
		}
	}
}
