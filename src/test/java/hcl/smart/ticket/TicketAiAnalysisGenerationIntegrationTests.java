package hcl.smart.ticket;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.UUID;

import hcl.smart.ticket.ai.AiAnalysisRequest;
import hcl.smart.ticket.ai.AiAnalysisResult;
import hcl.smart.ticket.ai.AiAnalysisService;
import hcl.smart.ticket.dto.request.CreateTicketRequest;
import hcl.smart.ticket.dto.response.TicketResponse;
import hcl.smart.ticket.entity.TicketAiAnalysis;
import hcl.smart.ticket.entity.User;
import hcl.smart.ticket.enums.AiAnalysisStatus;
import hcl.smart.ticket.enums.TicketPriority;
import hcl.smart.ticket.enums.UserRole;
import hcl.smart.ticket.repository.TicketAiAnalysisRepository;
import hcl.smart.ticket.repository.UserRepository;
import hcl.smart.ticket.security.UserPrincipal;
import hcl.smart.ticket.service.TicketAiAnalysisWorkflowService;
import hcl.smart.ticket.service.TicketService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

@SpringBootTest(
		properties = {
				"spring.datasource.url=jdbc:h2:mem:smartresolve-ai-after-commit;DB_CLOSE_DELAY=-1;MODE=PostgreSQL"
		})
@ActiveProfiles("test")
class TicketAiAnalysisGenerationIntegrationTests {

	@Autowired
	private TicketService ticketService;

	@Autowired
	private TicketAiAnalysisWorkflowService workflowService;

	@Autowired
	private UserRepository userRepository;

	@Autowired
	private TicketAiAnalysisRepository analysisRepository;

	@MockitoBean
	private AiAnalysisService aiAnalysisService;

	@Test
	void generatesAnalysisOnlyWhenEmployeeRequestsIt() {
		when(aiAnalysisService.analyze(any(AiAnalysisRequest.class))).thenReturn(new AiAnalysisResult(
				"Employee cannot access email",
				"EMAIL_ACCESS",
				TicketPriority.MEDIUM,
				List.of("Verify the account status"),
				"Support will review the account access issue."));
		User employee = userRepository.saveAndFlush(User.builder()
				.name("Employee")
				.email("employee-" + UUID.randomUUID() + "@example.test")
				.passwordHash("test-password-hash")
				.role(UserRole.EMPLOYEE)
				.build());

		TicketResponse ticket = ticketService.createTicket(
				UserPrincipal.from(employee),
				new CreateTicketRequest(
						"Cannot access email",
						"Outlook reports a connection failure.",
						null,
						null));

		assertThat(analysisRepository.findFirstByTicketIdOrderByCreatedAtDesc(ticket.id())).isEmpty();
		verify(aiAnalysisService, never()).analyze(any(AiAnalysisRequest.class));

		var analysisResponse = workflowService.analyze(UserPrincipal.from(employee), ticket.id());
		TicketAiAnalysis analysis = analysisRepository
				.findFirstByTicketIdOrderByCreatedAtDesc(ticket.id())
				.orElseThrow();
		assertThat(analysisResponse.status()).isEqualTo(AiAnalysisStatus.COMPLETED);
		assertThat(analysis.getStatus()).isEqualTo(AiAnalysisStatus.COMPLETED);
		assertThat(analysis.getIssueSummary()).isEqualTo("Employee cannot access email");
		assertThat(analysis.getSuggestedResponse()).isEqualTo("Support will review the account access issue.");
	}
}
