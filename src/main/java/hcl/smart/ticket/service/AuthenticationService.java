package hcl.smart.ticket.service;

import java.nio.charset.StandardCharsets;
import java.util.Locale;

import hcl.smart.ticket.dto.request.LoginRequest;
import hcl.smart.ticket.dto.request.RegisterRequest;
import hcl.smart.ticket.dto.response.AuthResponse;
import hcl.smart.ticket.dto.response.UserResponse;
import hcl.smart.ticket.entity.User;
import hcl.smart.ticket.enums.UserRole;
import hcl.smart.ticket.exception.AuthenticationFailureException;
import hcl.smart.ticket.exception.EmailAlreadyRegisteredException;
import hcl.smart.ticket.exception.PasswordTooLongException;
import hcl.smart.ticket.repository.UserRepository;
import hcl.smart.ticket.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationServiceException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthenticationService {

	private final UserRepository userRepository;
	private final PasswordEncoder passwordEncoder;
	private final AuthenticationManager authenticationManager;
	private final JwtTokenService jwtTokenService;

	@Transactional
	public AuthResponse register(RegisterRequest request) {
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
				.role(UserRole.EMPLOYEE)
				.active(true)
				.build();
		User savedUser = userRepository.saveAndFlush(user);
		return jwtTokenService.issueToken(UserPrincipal.from(savedUser));
	}

	public AuthResponse login(LoginRequest request) {
		if (exceedsBcryptLimit(request.password())) {
			throw new AuthenticationFailureException();
		}
		String email = normalizeEmail(request.email());
		try {
			Authentication authentication = authenticationManager.authenticate(
					UsernamePasswordAuthenticationToken.unauthenticated(email, request.password()));
			return jwtTokenService.issueToken((UserPrincipal) authentication.getPrincipal());
		} catch (AuthenticationException exception) {
			throw new AuthenticationFailureException();
		}
	}

	public UserResponse currentUser(UserPrincipal user) {
		if (user == null) {
			throw new AuthenticationServiceException("Authenticated user principal is unavailable");
		}
		return UserResponse.from(user);
	}

	private String normalizeEmail(String email) {
		return email.trim().toLowerCase(Locale.ROOT);
	}

	private boolean exceedsBcryptLimit(String password) {
		return password.getBytes(StandardCharsets.UTF_8).length > 72;
	}
}
