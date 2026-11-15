package hcl.smart.ticket.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import hcl.smart.ticket.dto.request.RegisterRequest;
import hcl.smart.ticket.dto.response.AuthResponse;
import hcl.smart.ticket.exception.EmailAlreadyRegisteredException;
import hcl.smart.ticket.exception.GlobalExceptionHandler;
import hcl.smart.ticket.service.AuthenticationService;
import jakarta.validation.Validator;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.validation.beanvalidation.LocalValidatorFactoryBean;

class AuthControllerMvcTest {

	private final AuthenticationService authenticationService =
			org.mockito.Mockito.mock(AuthenticationService.class);

	private MockMvc mockMvc;
	private LocalValidatorFactoryBean validatorFactory;

	@BeforeEach
	void setUp() {
		validatorFactory = new LocalValidatorFactoryBean();
		validatorFactory.afterPropertiesSet();
		mockMvc = MockMvcBuilders.standaloneSetup(new AuthController(authenticationService))
				.setControllerAdvice(new GlobalExceptionHandler())
				.setValidator(validatorFactory)
				.build();
	}

	@AfterEach
	void closeValidatorFactory() {
		validatorFactory.close();
	}

	@Test
	void rejectsInvalidRegistrationBeforeCallingService() throws Exception {
		mockMvc.perform(post("/api/auth/register")
						.contentType(MediaType.APPLICATION_JSON)
						.content("""
								{"name":"","email":"not-an-email","password":"short"}
								"""))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.status").value(400))
				.andExpect(jsonPath("$.path").value("/api/auth/register"))
				.andExpect(jsonPath("$.message").isNotEmpty());

		verify(authenticationService, never()).register(any(RegisterRequest.class));
	}

	@Test
	void returnsCreatedAndDelegatesValidRegistration() throws Exception {
		when(authenticationService.register(any(RegisterRequest.class)))
				.thenReturn(new AuthResponse("access-token", "Bearer", 900, null));

		mockMvc.perform(post("/api/auth/register")
						.contentType(MediaType.APPLICATION_JSON)
						.content("""
								{"name":"Employee","email":"employee@example.test","password":"Strong-password-123"}
								"""))
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$.accessToken").value("access-token"))
				.andExpect(jsonPath("$.expiresIn").value(900));

		verify(authenticationService).register(any(RegisterRequest.class));
	}

	@Test
	void mapsDuplicateRegistrationToConflictErrorResponse() throws Exception {
		when(authenticationService.register(any(RegisterRequest.class)))
				.thenThrow(new EmailAlreadyRegisteredException());

		mockMvc.perform(post("/api/auth/register")
						.contentType(MediaType.APPLICATION_JSON)
						.content("""
								{"name":"Employee","email":"employee@example.test","password":"Strong-password-123"}
								"""))
				.andExpect(status().isConflict())
				.andExpect(jsonPath("$.status").value(409))
				.andExpect(jsonPath("$.message").value("Email address is already registered"))
				.andExpect(jsonPath("$.path").value("/api/auth/register"));
	}
}
