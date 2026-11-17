package hcl.smart.ticket.dto.response;

import java.util.UUID;

public record SupportTeamOverviewResponse(
		UUID id,
		String name,
		String description,
		boolean active,
		long memberCount) {
}
