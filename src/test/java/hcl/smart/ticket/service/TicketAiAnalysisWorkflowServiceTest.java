package hcl.smart.ticket.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import hcl.smart.ticket.ai.AiAnalysisException;
import hcl.smart.ticket.ai.AiAnalysisResult;
import hcl.smart.ticket.ai.AiAnalysisService;
import hcl.smart.ticket.dto.response.TicketAiAnalysisResponse;
import hcl.smart.ticket.enums.AiAnalysisStatus;
import hcl.smart.ticket.enums.TicketPriority;
import hcl.smart.ticket.security.UserPrincipal;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class TicketAiAnalysisWorkflowServiceTest {

	@Mock
	private AiAnalysisService aiAnalysisService;

	@Mock
	private TicketAiAnalysisPersistenceService persistenceService;

	@InjectMocks
	private TicketAiAnalysisWorkflowService workflowService;

	@Test
	void persistsMockedAiResultForAuthorizedAnalysisRequest() {
		UserPrincipal actor = new UserPrincipal(
				UUID.randomUUID(), "Employee", "employee@example.test", "hash", "EMPLOYEE", true, Instant.now());
		UUID ticketId = UUID.randomUUID();
		TicketAiAnalysisPersistenceService.AnalysisContext context = context(ticketId);
		AiAnalysisResult result = new AiAnalysisResult(
				"Payroll access issue",
				"APPLICATION_ACCESS",
				TicketPriority.MEDIUM,
				List.of("Verify the latest password"),
				"Please verify your latest credentials.");
		TicketAiAnalysisResponse expected = response(ticketId, AiAnalysisStatus.COMPLETED);
		when(persistenceService.beginAnalysis(actor, ticketId)).thenReturn(context);
		when(aiAnalysisService.analyze(context.toRequest())).thenReturn(result);
		when(persistenceService.completeAnalysis(context, result)).thenReturn(expected);

		assertThat(workflowService.analyze(actor, ticketId)).isSameAs(expected);
		verify(persistenceService).completeAnalysis(context, result);
	}

	@Test
	void recordsFailedAnalysisWhenProviderIsUnavailable() {
		UUID ticketId = UUID.randomUUID();
		TicketAiAnalysisPersistenceService.AnalysisContext context = context(ticketId);
		TicketAiAnalysisResponse failed = response(ticketId, AiAnalysisStatus.FAILED);
		when(persistenceService.beginSystemAnalysis(ticketId)).thenReturn(context);
		when(aiAnalysisService.analyze(context.toRequest()))
				.thenThrow(new AiAnalysisException("AI API key is not configured"));
		when(persistenceService.failAnalysis(context)).thenReturn(failed);

		assertThat(workflowService.analyzeCreatedTicket(ticketId)).isSameAs(failed);
		verify(persistenceService).failAnalysis(context);
		verify(persistenceService, never()).completeAnalysis(eq(context), any(AiAnalysisResult.class));
	}

	private TicketAiAnalysisPersistenceService.AnalysisContext context(UUID ticketId) {
		return new TicketAiAnalysisPersistenceService.AnalysisContext(
				UUID.randomUUID(),
				ticketId,
				"Payroll access issue",
				"Cannot log in after changing password",
				List.of("APPLICATION_ACCESS"));
	}

	private TicketAiAnalysisResponse response(UUID ticketId, AiAnalysisStatus status) {
		return new TicketAiAnalysisResponse(
				UUID.randomUUID(),
				ticketId,
				"APPLICATION_ACCESS",
				null,
				TicketPriority.MEDIUM,
				"Payroll access issue",
				List.of("Verify the latest password"),
				"Please verify your latest credentials.",
				null,
				null,
				status,
				Instant.now());
	}
}
