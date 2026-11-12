package hcl.smart.ticket.ai;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.content;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.header;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.method;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withStatus;

import java.io.IOException;
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
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;
import tools.jackson.databind.ObjectMapper;

class SpringAiAnalysisServiceTest {

	private static final String ENDPOINT = "https://aicafe.test/AICafeService/api/v1/subscription/"
			+ "openai/deployments/gpt-4.1/chat/completions?api-version=2024-12-01-preview";
	private static final String API_KEY = "test-api-key";
	private static final ValidatorFactory VALIDATOR_FACTORY = Validation.buildDefaultValidatorFactory();
	private static final Validator VALIDATOR = VALIDATOR_FACTORY.getValidator();

	private RestClient.Builder restClientBuilder;
	private MockRestServiceServer server;
	private SpringAiAnalysisService service;

	@BeforeEach
	void setUp() {
		restClientBuilder = RestClient.builder();
		server = MockRestServiceServer.bindTo(restClientBuilder).build();
		service = createService(restClientBuilder, Runnable::run, Duration.ofSeconds(2), API_KEY);
	}

	@AfterAll
	static void closeValidatorFactory() {
		VALIDATOR_FACTORY.close();
	}

	@Test
	void postsToConfiguredAiCafeEndpointAndValidatesStructuredResponse() {
		server.expect(requestTo(ENDPOINT))
				.andExpect(method(HttpMethod.POST))
				.andExpect(header("api-key", API_KEY))
				.andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
				.andExpect(content().json("""
						{"model":"gpt-4.1","maxTokens":100,"temperature":0.2,"messages":[{"role":"system"},{"role":"user"}]}
						""", false))
				.andRespond(withSuccess(completionResponse("APPLICATION_ACCESS"), MediaType.APPLICATION_JSON));

		AiAnalysisResult result = service.analyze(new AiAnalysisRequest(
				"Payroll access issue",
				"Cannot log in after changing password",
				List.of("APPLICATION_ACCESS")));

		assertThat(result.suggestedPriority()).isEqualTo(TicketPriority.MEDIUM);
		assertThat(result.suggestedCategory()).isEqualTo("APPLICATION_ACCESS");
		server.verify();
	}

	@Test
	void rejectsCategoryOutsideConfiguredOptions() {
		server.expect(requestTo(ENDPOINT))
				.andRespond(withSuccess(completionResponse("NETWORK"), MediaType.APPLICATION_JSON));

		assertThatThrownBy(() -> service.analyze(new AiAnalysisRequest(
				"Payroll access issue",
				"Cannot log in",
				List.of("APPLICATION_ACCESS"))))
				.isInstanceOf(AiAnalysisException.class)
				.hasMessage("AI analysis provider returned an unknown category");
		server.verify();
	}

	@Test
	void reportsWhenTheProviderTruncatesOutputAtTheTokenLimit() {
		server.expect(requestTo(ENDPOINT))
				.andRespond(withSuccess("""
						{"choices":[{"finishReason":"length","message":{"content":"{\\"issueSummary\\":"}}]}
						""", MediaType.APPLICATION_JSON));

		assertThatThrownBy(() -> service.analyze(new AiAnalysisRequest(
				"Payroll access issue",
				"Cannot log in",
				List.of("APPLICATION_ACCESS"))))
				.isInstanceOf(AiAnalysisException.class)
				.hasMessage("AI response was truncated at the 100-token output limit");
		server.verify();
	}

	@Test
	void reportsProviderAuthenticationStatusWithoutExposingKey() {
		server.expect(requestTo(ENDPOINT)).andRespond(withStatus(HttpStatus.UNAUTHORIZED));

		assertThatThrownBy(() -> service.analyze(
				new AiAnalysisRequest("Title", "Description", List.of())))
				.isInstanceOf(AiAnalysisException.class)
				.hasMessage("AI Cafe returned HTTP 401");
		server.verify();
	}

	@Test
	void reportsUnavailableWhenApiKeyIsNotConfigured() {
		SpringAiAnalysisService unconfiguredService =
				createService(RestClient.builder(), Runnable::run, Duration.ofSeconds(2), "");

		assertThatThrownBy(() -> unconfiguredService.analyze(
				new AiAnalysisRequest("Title", "Description", List.of())))
				.isInstanceOf(AiAnalysisException.class)
				.hasMessage("AI API key is not configured");
	}

	@Test
	void convertsProviderTimeoutIntoAnalysisFailure() {
		RestClient.Builder delayedBuilder = RestClient.builder().requestInterceptor((request, body, execution) -> {
			try {
				Thread.sleep(1000);
			} catch (InterruptedException exception) {
				Thread.currentThread().interrupt();
				throw new IOException(exception);
			}
			return execution.execute(request, body);
		});
		MockRestServiceServer delayedServer = MockRestServiceServer.bindTo(delayedBuilder).build();
		delayedServer.expect(requestTo(ENDPOINT))
				.andRespond(withSuccess(completionResponse("APPLICATION_ACCESS"), MediaType.APPLICATION_JSON));
		ExecutorService timeoutExecutor = Executors.newSingleThreadExecutor();
		SpringAiAnalysisService timeoutService = createService(
				delayedBuilder, timeoutExecutor, Duration.ofMillis(25), API_KEY);

		try {
			assertThatThrownBy(() -> timeoutService.analyze(
					new AiAnalysisRequest("Title", "Description", List.of("APPLICATION_ACCESS"))))
					.isInstanceOf(AiAnalysisException.class)
					.hasMessage("AI analysis provider timed out");
		} finally {
			timeoutExecutor.shutdownNow();
		}
	}

	private SpringAiAnalysisService createService(
			RestClient.Builder builder, Executor executor, Duration timeout, String apiKey) {
		return new SpringAiAnalysisService(
				builder,
				new ObjectMapper(),
				VALIDATOR,
				executor,
				timeout,
				ENDPOINT,
				apiKey,
				"gpt-4.1",
				0.2);
	}

	private String completionResponse(String category) {
		return """
				{"choices":[{"finishReason":"stop","message":{"content":"{\\"issueSummary\\":\\"Cannot access payroll\\",\\"suggestedCategory\\":\\"%s\\",\\"suggestedPriority\\":\\"MEDIUM\\",\\"troubleshootingSteps\\":[\\"Check account status\\"],\\"suggestedResponse\\":\\"Support will investigate.\\"}"}}]}
				""".formatted(category);
	}
}
