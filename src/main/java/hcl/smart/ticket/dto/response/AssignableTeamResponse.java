package hcl.smart.ticket.dto.response;

import java.util.UUID;

import hcl.smart.ticket.entity.SupportTeam;

public record AssignableTeamResponse(UUID id, String name) {

	public static AssignableTeamResponse from(SupportTeam team) {
		return new AssignableTeamResponse(team.getId(), team.getName());
	}
}
