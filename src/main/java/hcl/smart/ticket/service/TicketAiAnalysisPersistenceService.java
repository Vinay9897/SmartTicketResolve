package hcl.smart.ticket.service;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import hcl.smart.ticket.ai.AiAnalysisException;
import hcl.smart.ticket.ai.AiAnalysisRequest;
import hcl.smart.ticket.ai.AiAnalysisResult;
import hcl.smart.ticket.dto.request.ReviewTicketAiAnalysisRequest;
import hcl.smart.ticket.dto.response.TicketAiAnalysisResponse;
import hcl.smart.ticket.entity.Ticket;
import hcl.smart.ticket.entity.TicketAiAnalysis;
import hcl.smart.ticket.entity.TicketCategory;
import hcl.smart.ticket.entity.User;
import hcl.smart.ticket.enums.AiAnalysisStatus;
import hcl.smart.ticket.enums.TicketPriority;
import hcl.smart.ticket.enums.UserRole;
import hcl.smart.ticket.exception.TicketNotFoundException;
import hcl.smart.ticket.repository.TicketAiAnalysisRepository;
import hcl.smart.ticket.repository.TicketCategoryRepository;
import hcl.smart.ticket.repository.TicketRepository;
import hcl.smart.ticket.repository.UserRepository;
import hcl.smart.ticket.security.UserPrincipal;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class TicketAiAnalysisPersistenceService {

	private final TicketAiAnalysisRepository analysisRepository;
	private final TicketCategoryRepository categoryRepository;
	private final TicketRepository ticketRepository;
	private final UserRepository userRepository;
	private final TicketAccessService ticketAccessService;

	@Transactional
	public AnalysisContext beginAnalysis(UserPrincipal actor, UUID ticketId) {
		Ticket ticket = accessibleTicket(actor, ticketId);
		List<String> categories = categoryRepository.findByActiveTrueOrderByNameAsc()
				.stream().map(TicketCategory::getName).toList();
		TicketAiAnalysis analysis = analysisRepository.save(TicketAiAnalysis.builder()
				.ticket(ticket)
				.status(AiAnalysisStatus.PENDING)
				.createdAt(Instant.now())
				.build());
		return new AnalysisContext(
				analysis.getId(),
				ticketId,
				ticket.getTitle(),
				ticket.getDescription(),
				categories);
	}

	@Transactional
	public TicketAiAnalysisResponse completeAnalysis(AnalysisContext context, AiAnalysisResult result) {
		TicketAiAnalysis analysis = findAnalysis(context.analysisId(), context.ticketId());
		TicketCategory category = categoryRepository.findByNameIgnoreCase(result.suggestedCategory().trim())
				.filter(TicketCategory::isActive)
				.orElse(null);
		analysis.setSuggestedCategory(category);
		analysis.setSuggestedCategoryName(result.suggestedCategory().trim());
		analysis.setSuggestedPriority(result.suggestedPriority());
		analysis.setIssueSummary(result.issueSummary().trim());
		analysis.setTroubleshootingSteps(String.join("\n", result.troubleshootingSteps()));
		analysis.setSuggestedResponse(result.suggestedResponse().trim());
		analysis.setStatus(AiAnalysisStatus.COMPLETED);
		return toResponse(analysisRepository.save(analysis));
	}

	@Transactional
	public TicketAiAnalysisResponse failAnalysis(AnalysisContext context, String failureMessage) {
		TicketAiAnalysis analysis = findAnalysis(context.analysisId(), context.ticketId());
		analysis.setStatus(AiAnalysisStatus.FAILED);
		analysis.setFailureMessage(failureMessage);
		return toResponse(analysisRepository.save(analysis));
	}

	@Transactional
	public TicketAiAnalysisResponse getLatest(UserPrincipal actor, UUID ticketId) {
		accessibleTicket(actor, ticketId);
		return analysisRepository.findFirstByTicketIdOrderByCreatedAtDesc(ticketId)
				.map(this::toResponse)
				.orElseThrow(TicketNotFoundException::new);
	}

	@Transactional
	public TicketAiAnalysisResponse review(
			UserPrincipal actor, UUID ticketId, ReviewTicketAiAnalysisRequest request) {
		requireSupportEngineer(actor);
		Ticket ticket = accessibleTicket(actor, ticketId);
		TicketAiAnalysis analysis = analysisRepository.findFirstByTicketIdOrderByCreatedAtDesc(ticketId)
				.orElseThrow(TicketNotFoundException::new);
		if (analysis.getStatus() != AiAnalysisStatus.COMPLETED
				&& analysis.getStatus() != AiAnalysisStatus.REVIEWED) {
			throw new AiAnalysisException("Only completed AI analyses can be reviewed");
		}
		TicketCategory category = categoryRepository.findById(request.suggestedCategoryId())
				.filter(TicketCategory::isActive)
				.orElseThrow(() -> new AiAnalysisException("Selected ticket category is unavailable"));
		User reviewer = userRepository.findById(actor.id())
				.filter(User::isActive)
				.orElseThrow(() -> new AccessDeniedException("Active support engineer access is required"));
		analysis.setSuggestedCategory(category);
		analysis.setSuggestedCategoryName(category.getName());
		analysis.setSuggestedPriority(request.suggestedPriority());
		analysis.setIssueSummary(request.issueSummary().trim());
		analysis.setTroubleshootingSteps(String.join("\n", request.troubleshootingSteps()));
		analysis.setSuggestedResponse(request.suggestedResponse().trim());
		analysis.setReviewedBy(reviewer);
		analysis.setReviewedAt(Instant.now());
		analysis.setStatus(AiAnalysisStatus.REVIEWED);
		return toResponse(analysisRepository.save(analysis));
	}

	@Transactional
	public AnalysisContext beginSystemAnalysis(UUID ticketId) {
		Ticket ticket = ticketRepository.findById(ticketId).orElseThrow(TicketNotFoundException::new);
		List<String> categories = categoryRepository.findByActiveTrueOrderByNameAsc()
				.stream().map(TicketCategory::getName).toList();
		TicketAiAnalysis analysis = analysisRepository.save(TicketAiAnalysis.builder()
				.ticket(ticket)
				.status(AiAnalysisStatus.PENDING)
				.createdAt(Instant.now())
				.build());
		return new AnalysisContext(analysis.getId(), ticketId, ticket.getTitle(), ticket.getDescription(), categories);
	}

	private Ticket accessibleTicket(UserPrincipal actor, UUID ticketId) {
		Ticket ticket = ticketRepository.findById(ticketId).orElseThrow(TicketNotFoundException::new);
		ticketAccessService.requireCanAccess(actor, ticket);
		return ticket;
	}

	private TicketAiAnalysis findAnalysis(UUID analysisId, UUID ticketId) {
		return analysisRepository.findByIdAndTicketId(analysisId, ticketId)
				.orElseThrow(TicketNotFoundException::new);
	}

	private void requireSupportEngineer(UserPrincipal actor) {
		if (actor == null || !UserRole.SUPPORT_ENGINEER.name().equals(actor.role())) {
			throw new AccessDeniedException("Support engineer access is required");
		}
	}

	private TicketAiAnalysisResponse toResponse(TicketAiAnalysis analysis) {
		return new TicketAiAnalysisResponse(
				analysis.getId(),
				analysis.getTicket().getId(),
				analysis.getSuggestedCategoryName(),
				analysis.getSuggestedCategory() == null ? null : analysis.getSuggestedCategory().getId(),
				analysis.getSuggestedPriority(),
				analysis.getIssueSummary(),
				analysis.getTroubleshootingSteps() == null || analysis.getTroubleshootingSteps().isBlank()
						? List.of()
						: analysis.getTroubleshootingSteps().lines().toList(),
				analysis.getSuggestedResponse(),
				analysis.getReviewedBy() == null ? null : analysis.getReviewedBy().getId(),
				analysis.getReviewedAt(),
				analysis.getStatus(),
				analysis.getCreatedAt(),
				analysis.getFailureMessage());
	}

	public record AnalysisContext(
			UUID analysisId,
			UUID ticketId,
			String title,
			String description,
			List<String> allowedCategories) {

		public AiAnalysisRequest toRequest() {
			return new AiAnalysisRequest(title, description, allowedCategories);
		}
	}
}
