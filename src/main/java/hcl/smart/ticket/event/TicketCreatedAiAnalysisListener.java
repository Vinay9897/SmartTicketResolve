package hcl.smart.ticket.event;

import hcl.smart.ticket.service.TicketAiAnalysisWorkflowService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

@Component
@RequiredArgsConstructor
public class TicketCreatedAiAnalysisListener {

	private final TicketAiAnalysisWorkflowService workflowService;

	@Value("${smartresolve.ai.auto-analyze-on-create:true}")
	private boolean autoAnalyzeOnCreate;

	@TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
	public void analyzeTicketAfterCreation(TicketCreatedEvent event) {
		if (autoAnalyzeOnCreate) {
			workflowService.analyzeCreatedTicket(event.ticketId());
		}
	}
}
