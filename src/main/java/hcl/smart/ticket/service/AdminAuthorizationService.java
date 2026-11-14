package hcl.smart.ticket.service;

import hcl.smart.ticket.security.UserPrincipal;
import hcl.smart.ticket.enums.UserRole;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;

@Service
public class AdminAuthorizationService {

	public void requireAdmin(UserPrincipal actor) {
		if (actor == null || !UserRole.ADMIN.name().equals(actor.role())) {
			throw new AccessDeniedException("Administrator access is required");
		}
	}
}
