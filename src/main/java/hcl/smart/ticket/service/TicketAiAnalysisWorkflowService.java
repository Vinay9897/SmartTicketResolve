package hcl.smart.ticket.service;

import java.util.UUID;

import hcl.smart.ticket.ai.AiAnalysisException;
import hcl.smart.ticket.ai.AiAnalysisService;
import hcl.smart.ticket.ai.AiAnalysisResult;
import hcl.smart.ticket.dto.request.ReviewTicketAiAnalysisRequest;
import hcl.smart.ticket.dto.response.TicketAiAnalysisResponse;
import hcl.smart.ticket.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class TicketAiAnalysisWorkflowService {

	private static final Logger LOGGER = LoggerFactory.getLogger(TicketAiAnalysisWorkflowService.class);

	private final AiAnalysisService aiAnalysisService;
	private final TicketAiAnalysisPersistenceService persistenceService;

	public TicketAiAnalysisResponse analyze(UserPrincipal actor, UUID ticketId) {
		return analyze(persistenceService.beginAnalysis(actor, ticketId));
	}

	public TicketAiAnalysisResponse analyzeCreatedTicket(UUID ticketId) {
		return analyze(persistenceService.beginSystemAnalysis(ticketId));
	}

	public TicketAiAnalysisResponse getLatest(UserPrincipal actor, UUID ticketId) {
		return persistenceService.getLatest(actor, ticketId);
	}

	public TicketAiAnalysisResponse review(
			UserPrincipal actor, UUID ticketId, ReviewTicketAiAnalysisRequest request) {
		return persistenceService.review(actor, ticketId, request);
	}

	private TicketAiAnalysisResponse analyze(TicketAiAnalysisPersistenceService.AnalysisContext context) {
		try {
			AiAnalysisResult result = aiAnalysisService.analyze(context.toRequest());
			return persistenceService.completeAnalysis(context, result);
		} catch (AiAnalysisException exception) {
			LOGGER.warn("AI analysis failed for ticket {}: {}", context.ticketId(), exception.getMessage());
			return persistenceService.failAnalysis(context, exception.getMessage());
		}
	}
}
