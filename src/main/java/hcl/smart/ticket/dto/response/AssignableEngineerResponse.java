package hcl.smart.ticket.dto.response;

import java.util.UUID;

import hcl.smart.ticket.entity.User;

public record AssignableEngineerResponse(UUID id, String name) {

	public static AssignableEngineerResponse from(User user) {
		return new AssignableEngineerResponse(user.getId(), user.getName());
	}
}
