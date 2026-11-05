package hcl.smart.ticket.dto.response;

import java.time.Instant;
import java.util.UUID;

import hcl.smart.ticket.entity.User;
import hcl.smart.ticket.enums.UserRole;
import hcl.smart.ticket.security.UserPrincipal;

public record UserResponse(UUID id, String name, String email, UserRole role, boolean active, Instant createdAt) {

	public static UserResponse from(User user) {
		return new UserResponse(
				user.getId(),
				user.getName(),
				user.getEmail(),
				user.getRole(),
				user.isActive(),
				user.getCreatedAt());
	}

	public static UserResponse from(UserPrincipal user) {
		return new UserResponse(
				user.id(),
				user.name(),
				user.email(),
				UserRole.valueOf(user.role()),
				user.active(),
				user.createdAt());
	}
}
