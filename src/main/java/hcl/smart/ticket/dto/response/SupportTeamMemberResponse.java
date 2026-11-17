package hcl.smart.ticket.dto.response;

import java.time.Instant;
import java.util.UUID;

import hcl.smart.ticket.entity.TeamMembership;

public record SupportTeamMemberResponse(
		UUID id,
		String name,
		String email,
		boolean active,
		Instant joinedAt) {

	public static SupportTeamMemberResponse from(TeamMembership membership) {
		return new SupportTeamMemberResponse(
				membership.getUser().getId(),
				membership.getUser().getName(),
				membership.getUser().getEmail(),
				membership.getUser().isActive(),
				membership.getJoinedAt());
	}
}
