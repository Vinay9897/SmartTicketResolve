package hcl.smart.ticket.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Optional;

import hcl.smart.ticket.dto.request.RegisterRequest;
import hcl.smart.ticket.dto.response.AuthResponse;
import hcl.smart.ticket.entity.User;
import hcl.smart.ticket.enums.UserRole;
import hcl.smart.ticket.exception.AuthenticationFailureException;
import hcl.smart.ticket.exception.EmailAlreadyRegisteredException;
import hcl.smart.ticket.exception.PasswordTooLongException;
import hcl.smart.ticket.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;

@ExtendWith(MockitoExtension.class)
class AuthenticationServiceTest {

	@Mock
	private UserRepository userRepository;

	@Mock
	private PasswordEncoder passwordEncoder;

	@Mock
	private AuthenticationManager authenticationManager;

	@Mock
	private JwtTokenService jwtTokenService;

	@InjectMocks
	private AuthenticationService authenticationService;

	@Test
	void registrationCreatesOnlyAnEmployeeAndStoresEncodedPassword() {
		when(userRepository.findByEmailIgnoreCase("employee@example.test")).thenReturn(Optional.empty());
		when(passwordEncoder.encode("Strong-password-123")).thenReturn("bcrypt-hash");
		when(userRepository.saveAndFlush(any(User.class)))
				.thenAnswer(invocation -> invocation.getArgument(0));
		AuthResponse expectedResponse = new AuthResponse("token", "Bearer", 900, null);
		when(jwtTokenService.issueToken(any())).thenReturn(expectedResponse);

		AuthResponse response = authenticationService.register(
				new RegisterRequest(" Employee ", "EMPLOYEE@Example.Test", "Strong-password-123"));

		ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
		verify(userRepository).saveAndFlush(userCaptor.capture());
		User createdUser = userCaptor.getValue();
		assertThat(createdUser.getName()).isEqualTo("Employee");
		assertThat(createdUser.getEmail()).isEqualTo("employee@example.test");
		assertThat(createdUser.getPasswordHash()).isEqualTo("bcrypt-hash");
		assertThat(createdUser.getRole()).isEqualTo(UserRole.EMPLOYEE);
		assertThat(createdUser.isActive()).isTrue();
		assertThat(response).isEqualTo(expectedResponse);
	}

	@Test
	void registrationRejectsAnExistingEmail() {
		when(userRepository.findByEmailIgnoreCase("employee@example.test"))
				.thenReturn(Optional.of(User.builder().email("employee@example.test").build()));

		assertThatThrownBy(() -> authenticationService.register(
				new RegisterRequest("Employee", "employee@example.test", "Strong-password-123")))
				.isInstanceOf(EmailAlreadyRegisteredException.class);
	}

	@Test
	void registrationRejectsPasswordsLongerThanBcryptByteLimit() {
		String password = "😀".repeat(19);

		assertThatThrownBy(() -> authenticationService.register(
				new RegisterRequest("Employee", "employee@example.test", password)))
				.isInstanceOf(PasswordTooLongException.class);
	}

	@Test
	void loginDoesNotRevealInactiveAccountDetails() {
		when(authenticationManager.authenticate(any(Authentication.class)))
				.thenThrow(new DisabledException("Account is inactive"));

		assertThatThrownBy(() -> authenticationService.login(
				new hcl.smart.ticket.dto.request.LoginRequest("employee@example.test", "password")))
				.isInstanceOf(AuthenticationFailureException.class)
				.hasMessage("Invalid email or password");
	}
}
