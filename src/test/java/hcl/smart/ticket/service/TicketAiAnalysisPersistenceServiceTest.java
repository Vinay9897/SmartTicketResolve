package hcl.smart.ticket.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

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
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;

@ExtendWith(MockitoExtension.class)
class TicketAiAnalysisPersistenceServiceTest {

	@Mock
	private TicketAiAnalysisRepository analysisRepository;

	@Mock
	private TicketCategoryRepository categoryRepository;

	@Mock
	private TicketRepository ticketRepository;

	@Mock
	private UserRepository userRepository;

	@Mock
	private TicketAccessService ticketAccessService;

	@InjectMocks
	private TicketAiAnalysisPersistenceService persistenceService;

	@Test
	void beginsAuthorizedAnalysisWithOnlyActiveCategories() {
		UUID ticketId = UUID.randomUUID();
		UUID analysisId = UUID.randomUUID();
		UserPrincipal actor = principal(UUID.randomUUID(), UserRole.EMPLOYEE);
		Ticket ticket = ticket(ticketId);
		when(ticketRepository.findById(ticketId)).thenReturn(Optional.of(ticket));
		when(categoryRepository.findByActiveTrueOrderByNameAsc()).thenReturn(List.of(
				TicketCategory.builder().name("Hardware").build(),
				TicketCategory.builder().name("Network").build()));
		when(analysisRepository.save(any(TicketAiAnalysis.class))).thenAnswer(invocation -> {
			TicketAiAnalysis analysis = invocation.getArgument(0);
			analysis.setId(analysisId);
			return analysis;
		});

		TicketAiAnalysisPersistenceService.AnalysisContext context =
				persistenceService.beginAnalysis(actor, ticketId);

		assertThat(context.analysisId()).isEqualTo(analysisId);
		assertThat(context.ticketId()).isEqualTo(ticketId);
		assertThat(context.title()).isEqualTo(ticket.getTitle());
		assertThat(context.toRequest().allowedCategories()).containsExactly("Hardware", "Network");
		verify(ticketAccessService).requireCanAccess(actor, ticket);
		verify(analysisRepository).save(any(TicketAiAnalysis.class));
	}

	@Test
	void completesAnalysisAndMapsNormalizedProviderFields() {
		UUID ticketId = UUID.randomUUID();
		UUID analysisId = UUID.randomUUID();
		Ticket ticket = ticket(ticketId);
		TicketAiAnalysis analysis = analysis(analysisId, ticket, AiAnalysisStatus.PENDING);
		TicketCategory category = TicketCategory.builder()
				.id(UUID.randomUUID())
				.name("APPLICATION_ACCESS")
				.build();
		when(analysisRepository.findByIdAndTicketId(analysisId, ticketId)).thenReturn(Optional.of(analysis));
		when(categoryRepository.findByNameIgnoreCase("APPLICATION_ACCESS")).thenReturn(Optional.of(category));
		when(analysisRepository.save(analysis)).thenReturn(analysis);

		TicketAiAnalysisResponse response = persistenceService.completeAnalysis(
				new TicketAiAnalysisPersistenceService.AnalysisContext(
						analysisId, ticketId, ticket.getTitle(), ticket.getDescription(), List.of()),
				new AiAnalysisResult(
						" Cannot access payroll ",
						" APPLICATION_ACCESS ",
						TicketPriority.HIGH,
						List.of(" Check account status ", " Contact support "),
						" Support will investigate. "));

		assertThat(response.status()).isEqualTo(AiAnalysisStatus.COMPLETED);
		assertThat(response.suggestedCategoryName()).isEqualTo("APPLICATION_ACCESS");
		assertThat(response.suggestedCategoryId()).isEqualTo(category.getId());
		assertThat(response.suggestedPriority()).isEqualTo(TicketPriority.HIGH);
		assertThat(response.issueSummary()).isEqualTo("Cannot access payroll");
		assertThat(response.troubleshootingSteps()).containsExactly(" Check account status ", " Contact support ");
		assertThat(response.suggestedResponse()).isEqualTo("Support will investigate.");
	}

	@Test
	void marksProviderFailureWithoutInventingAnalysisContent() {
		UUID ticketId = UUID.randomUUID();
		UUID analysisId = UUID.randomUUID();
		TicketAiAnalysis analysis = analysis(analysisId, ticket(ticketId), AiAnalysisStatus.PENDING);
		when(analysisRepository.findByIdAndTicketId(analysisId, ticketId)).thenReturn(Optional.of(analysis));
		when(analysisRepository.save(analysis)).thenReturn(analysis);

		TicketAiAnalysisResponse response = persistenceService.failAnalysis(
				new TicketAiAnalysisPersistenceService.AnalysisContext(
						analysisId, ticketId, "title", "description", List.of()),
				"AI analysis provider timed out");

		assertThat(response.status()).isEqualTo(AiAnalysisStatus.FAILED);
		assertThat(response.failureMessage()).isEqualTo("AI analysis provider timed out");
		assertThat(response.issueSummary()).isNull();
		assertThat(response.troubleshootingSteps()).isEmpty();
	}

	@Test
	void allowsSupportEngineerToReviewCompletedAnalysis() {
		UUID ticketId = UUID.randomUUID();
		UUID categoryId = UUID.randomUUID();
		UUID reviewerId = UUID.randomUUID();
		Ticket ticket = ticket(ticketId);
		TicketAiAnalysis analysis = analysis(UUID.randomUUID(), ticket, AiAnalysisStatus.COMPLETED);
		TicketCategory category = TicketCategory.builder().id(categoryId).name("Hardware").build();
		User reviewer = User.builder().id(reviewerId).name("Engineer").email("engineer@example.test")
				.passwordHash("hash").role(UserRole.SUPPORT_ENGINEER).build();
		UserPrincipal actor = principal(reviewerId, UserRole.SUPPORT_ENGINEER);
		when(ticketRepository.findById(ticketId)).thenReturn(Optional.of(ticket));
		when(analysisRepository.findFirstByTicketIdOrderByCreatedAtDesc(ticketId)).thenReturn(Optional.of(analysis));
		when(categoryRepository.findById(categoryId)).thenReturn(Optional.of(category));
		when(userRepository.findById(reviewerId)).thenReturn(Optional.of(reviewer));
		when(analysisRepository.save(analysis)).thenReturn(analysis);

		TicketAiAnalysisResponse response = persistenceService.review(actor, ticketId,
				new ReviewTicketAiAnalysisRequest(
						" Reviewed summary ", categoryId, TicketPriority.LOW,
						List.of("Verify the cable"), " We will follow up. "));

		assertThat(response.status()).isEqualTo(AiAnalysisStatus.REVIEWED);
		assertThat(response.suggestedCategoryId()).isEqualTo(categoryId);
		assertThat(response.suggestedPriority()).isEqualTo(TicketPriority.LOW);
		assertThat(response.issueSummary()).isEqualTo("Reviewed summary");
		assertThat(response.reviewedById()).isEqualTo(reviewerId);
		assertThat(response.reviewedAt()).isNotNull();
		verify(ticketAccessService).requireCanAccess(actor, ticket);
	}

	@Test
	void rejectsReviewFromNonSupportRoleBeforeDatabaseAccess() {
		assertThatThrownBy(() -> persistenceService.review(
				principal(UUID.randomUUID(), UserRole.EMPLOYEE),
				UUID.randomUUID(),
				new ReviewTicketAiAnalysisRequest(
						"summary", UUID.randomUUID(), TicketPriority.MEDIUM,
						List.of("step"), "response")))
				.isInstanceOf(AccessDeniedException.class)
				.hasMessage("Support engineer access is required");

		verify(ticketRepository, never()).findById(any());
	}

	@Test
	void reportsMissingLatestAnalysisAsNotFound() {
		UUID ticketId = UUID.randomUUID();
		UserPrincipal actor = principal(UUID.randomUUID(), UserRole.EMPLOYEE);
		Ticket ticket = ticket(ticketId);
		when(ticketRepository.findById(ticketId)).thenReturn(Optional.of(ticket));
		when(analysisRepository.findFirstByTicketIdOrderByCreatedAtDesc(ticketId)).thenReturn(Optional.empty());

		assertThatThrownBy(() -> persistenceService.getLatest(actor, ticketId))
				.isInstanceOf(TicketNotFoundException.class);
		verify(ticketAccessService).requireCanAccess(actor, ticket);
	}

	private Ticket ticket(UUID ticketId) {
		return Ticket.builder()
				.id(ticketId)
				.title("Payroll access issue")
				.description("Cannot log in after changing password")
				.createdBy(User.builder().id(UUID.randomUUID()).build())
				.priority(TicketPriority.MEDIUM)
				.status(hcl.smart.ticket.enums.TicketStatus.OPEN)
				.build();
	}

	private TicketAiAnalysis analysis(UUID analysisId, Ticket ticket, AiAnalysisStatus status) {
		return TicketAiAnalysis.builder()
				.id(analysisId)
				.ticket(ticket)
				.status(status)
				.createdAt(Instant.now())
				.build();
	}

	private UserPrincipal principal(UUID userId, UserRole role) {
		return new UserPrincipal(userId, "Test user", "test@example.test", "hash", role.name(), true, Instant.now());
	}
}
