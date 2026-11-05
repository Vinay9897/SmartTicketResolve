package hcl.smart.ticket.security;

import java.util.Collection;
import java.util.List;
import java.util.UUID;
import java.time.Instant;

import hcl.smart.ticket.entity.User;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

public record UserPrincipal(
		UUID id,
		String name,
		String email,
		String passwordHash,
		String role,
		boolean active,
		Instant createdAt) implements UserDetails {

	public static UserPrincipal from(User user) {
		return new UserPrincipal(
				user.getId(),
				user.getName(),
				user.getEmail(),
				user.getPasswordHash(),
				user.getRole().name(),
				user.isActive(),
				user.getCreatedAt());
	}

	@Override
	public Collection<? extends GrantedAuthority> getAuthorities() {
		return List.of(new SimpleGrantedAuthority("ROLE_" + role));
	}

	@Override
	public String getPassword() {
		return passwordHash;
	}

	@Override
	public String getUsername() {
		return email;
	}

	@Override
	public boolean isEnabled() {
		return active;
	}
}
