package hcl.smart.ticket.service;

import java.nio.charset.StandardCharsets;
import java.util.Locale;
import java.util.UUID;

import hcl.smart.ticket.dto.request.AdminCreateUserRequest;
import hcl.smart.ticket.dto.request.AdminUpdateUserRequest;
import hcl.smart.ticket.dto.request.UpdateUserStatusRequest;
import hcl.smart.ticket.dto.response.PageResponse;
import hcl.smart.ticket.dto.response.UserResponse;
import hcl.smart.ticket.entity.User;
import hcl.smart.ticket.enums.UserRole;
import hcl.smart.ticket.exception.EmailAlreadyRegisteredException;
import hcl.smart.ticket.exception.PasswordTooLongException;
import hcl.smart.ticket.exception.TicketNotFoundException;
import hcl.smart.ticket.repository.UserRepository;
import hcl.smart.ticket.repository.TeamMembershipRepository;
import hcl.smart.ticket.security.UserPrincipal;
import hcl.smart.ticket.exception.TicketOperationException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UserManagementService {

	private final UserRepository userRepository;
	private final TeamMembershipRepository teamMembershipRepository;
	private final PasswordEncoder passwordEncoder;
	private final AdminAuthorizationService authorizationService;

	@Transactional(readOnly = true)
	public PageResponse<UserResponse> findUsers(
			UserPrincipal actor, Pageable pageable, String search, UserRole role) {
		authorizationService.requireAdmin(actor);
		String normalizedSearch = search == null ? "" : search.trim();
		Page<User> users = userRepository.searchUsers(role, normalizedSearch, pageable);
		return PageResponse.from(users, UserResponse::from);
	}

	@Transactional(readOnly = true)
	public UserResponse getUser(UserPrincipal actor, UUID userId) {
		authorizationService.requireAdmin(actor);
		return UserResponse.from(findUser(userId));
	}

	@Transactional
	public UserResponse createUser(UserPrincipal actor, AdminCreateUserRequest request) {
		authorizationService.requireAdmin(actor);
		if (exceedsBcryptLimit(request.password())) {
			throw new PasswordTooLongException();
		}
		String email = normalizeEmail(request.email());
		if (userRepository.findByEmailIgnoreCase(email).isPresent()) {
			throw new EmailAlreadyRegisteredException();
		}
		User user = User.builder()
				.name(request.name().trim())
				.email(email)
				.passwordHash(passwordEncoder.encode(request.password()))
				.role(request.role())
				.active(true)
				.build();
		return UserResponse.from(userRepository.saveAndFlush(user));
	}

	@Transactional
	public UserResponse updateUser(UserPrincipal actor, UUID userId, AdminUpdateUserRequest request) {
		authorizationService.requireAdmin(actor);
		User user = findUser(userId);
		if (user.getRole() == UserRole.SUPPORT_ENGINEER
				&& request.role() != UserRole.SUPPORT_ENGINEER
				&& teamMembershipRepository.existsByUserId(userId)) {
			throw new TicketOperationException("Remove this support engineer from all teams before changing their role");
		}
		String email = normalizeEmail(request.email());
		if (!email.equalsIgnoreCase(user.getEmail())
				&& userRepository.findByEmailIgnoreCase(email).isPresent()) {
			throw new EmailAlreadyRegisteredException();
		}
		user.setName(request.name().trim());
		user.setEmail(email);
		user.setRole(request.role());
		if (request.password() != null && !request.password().isBlank()) {
			if (exceedsBcryptLimit(request.password())) {
				throw new PasswordTooLongException();
			}
			user.setPasswordHash(passwordEncoder.encode(request.password()));
		}
		return UserResponse.from(userRepository.saveAndFlush(user));
	}

	@Transactional
	public UserResponse updateStatus(
			UserPrincipal actor, UUID userId, UpdateUserStatusRequest request) {
		authorizationService.requireAdmin(actor);
		User user = findUser(userId);
		user.setActive(request.active());
		return UserResponse.from(userRepository.saveAndFlush(user));
	}

	private User findUser(UUID userId) {
		return userRepository.findById(userId).orElseThrow(TicketNotFoundException::new);
	}

	private String normalizeEmail(String email) {
		return email.trim().toLowerCase(Locale.ROOT);
	}

	private boolean exceedsBcryptLimit(String password) {
		return password.getBytes(StandardCharsets.UTF_8).length > 72;
	}
}
