package hcl.smart.ticket.ai;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.RETURNS_DEEP_STUBS;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import java.time.Duration;
import java.util.List;
import java.util.concurrent.Executor;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

import hcl.smart.ticket.enums.TicketPriority;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.ai.chat.client.ChatClient;
import tools.jackson.databind.ObjectMapper;

class SpringAiAnalysisServiceTest {

	private static final ValidatorFactory VALIDATOR_FACTORY = Validation.buildDefaultValidatorFactory();
	private static final Validator VALIDATOR = VALIDATOR_FACTORY.getValidator();

	private final ObjectProvider<ChatClient.Builder> builderProvider = mock(ObjectProvider.class);
	private final ChatClient.Builder builder = mock(ChatClient.Builder.class, RETURNS_DEEP_STUBS);
	private final Executor directExecutor = Runnable::run;
	private SpringAiAnalysisService service;

	@BeforeEach
	void setUp() {
		when(builderProvider.getIfAvailable()).thenReturn(builder);
		when(builder.clone()).thenReturn(builder);
		service = new SpringAiAnalysisService(
				builderProvider,
				new ObjectMapper(),
				VALIDATOR,
				directExecutor,
				Duration.ofSeconds(2));
	}

	@AfterAll
	static void closeValidatorFactory() {
		VALIDATOR_FACTORY.close();
	}

	@Test
	void analyzesTicketUsingStructuredValidatedResponse() {
		AiAnalysisRequest request = new AiAnalysisRequest(
				"Payroll access issue",
				"Cannot log in after changing password",
				List.of("APPLICATION_ACCESS"));
		AiAnalysisResult expected = new AiAnalysisResult(
				"Employee cannot access payroll after a password change",
				"APPLICATION_ACCESS",
				TicketPriority.MEDIUM,
				List.of("Verify the latest password", "Check account lock status"),
				"Please verify your latest credentials.");
		when(builder.build().prompt().system(anyString()).user(anyString())
				.call().entity(AiAnalysisResult.class)).thenReturn(expected);

		assertThat(service.analyze(request)).isEqualTo(expected);
	}

	@Test
	void rejectsCategoryOutsideConfiguredOptions() {
		AiAnalysisRequest request = new AiAnalysisRequest(
				"Payroll access issue",
				"Cannot log in",
				List.of("APPLICATION_ACCESS"));
		AiAnalysisResult invalid = new AiAnalysisResult(
				"Cannot log in",
				"NETWORK",
				TicketPriority.MEDIUM,
				List.of("Check account status"),
				"Support will investigate.");
		when(builder.build().prompt().system(anyString()).user(anyString())
				.call().entity(AiAnalysisResult.class)).thenReturn(invalid);

		assertThatThrownBy(() -> service.analyze(request))
				.isInstanceOf(AiAnalysisException.class)
				.hasMessage("AI analysis provider returned an unknown category");
	}

	@Test
	void reportsUnavailableWhenNoProviderIsConfigured() {
		when(builderProvider.getIfAvailable()).thenReturn(null);

		assertThatThrownBy(() -> service.analyze(
				new AiAnalysisRequest("Title", "Description", List.of())))
				.isInstanceOf(AiAnalysisException.class)
				.hasMessage("No Spring AI chat provider is configured");
	}

	@Test
	void convertsProviderTimeoutIntoAnalysisFailure() {
		ExecutorService timeoutExecutor = Executors.newSingleThreadExecutor();
		AiAnalysisResult response = new AiAnalysisResult(
				"Payroll access issue",
				"APPLICATION_ACCESS",
				TicketPriority.MEDIUM,
				List.of("Verify the latest password"),
				"Please verify your latest credentials.");
		when(builder.build().prompt().system(anyString()).user(anyString())
				.call().entity(AiAnalysisResult.class)).thenAnswer(invocation -> {
					Thread.sleep(1000);
					return response;
				});
		SpringAiAnalysisService timeoutService = new SpringAiAnalysisService(
				builderProvider,
				new ObjectMapper(),
				VALIDATOR,
				timeoutExecutor,
				Duration.ofMillis(25));

		try {
			assertThatThrownBy(() -> timeoutService.analyze(
					new AiAnalysisRequest("Title", "Description", List.of("APPLICATION_ACCESS"))))
					.isInstanceOf(AiAnalysisException.class)
					.hasMessage("AI analysis provider timed out");
		} finally {
			timeoutExecutor.shutdownNow();
		}
	}
}
