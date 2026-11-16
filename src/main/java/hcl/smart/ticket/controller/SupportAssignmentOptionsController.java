package hcl.smart.ticket.controller;

import java.util.List;
import java.util.UUID;

import hcl.smart.ticket.dto.response.AssignableEngineerResponse;
import hcl.smart.ticket.dto.response.AssignableTeamResponse;
import hcl.smart.ticket.security.UserPrincipal;
import hcl.smart.ticket.service.SupportAssignmentOptionsService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/support/assignment-options")
@RequiredArgsConstructor
public class SupportAssignmentOptionsController {

	private final SupportAssignmentOptionsService assignmentOptionsService;

	@GetMapping("/engineers")
	public List<AssignableEngineerResponse> getAvailableEngineers(
			@AuthenticationPrincipal UserPrincipal principal,
			@RequestParam(required = false) UUID teamId) {
		return assignmentOptionsService.getAvailableEngineers(principal, teamId);
	}

	@GetMapping("/teams")
	public List<AssignableTeamResponse> getAvailableTeams(
			@AuthenticationPrincipal UserPrincipal principal) {
		return assignmentOptionsService.getAvailableTeams(principal);
	}
}
