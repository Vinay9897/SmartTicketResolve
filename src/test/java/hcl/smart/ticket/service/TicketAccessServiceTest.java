package hcl.smart.ticket.service;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.util.UUID;

import hcl.smart.ticket.entity.SupportTeam;
import hcl.smart.ticket.entity.Ticket;
import hcl.smart.ticket.entity.User;
import hcl.smart.ticket.repository.TeamMembershipRepository;
import hcl.smart.ticket.security.UserPrincipal;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;

@ExtendWith(MockitoExtension.class)
class TicketAccessServiceTest {

	@Mock
	private TeamMembershipRepository teamMembershipRepository;

	@InjectMocks
	private TicketAccessService ticketAccessService;

	@Test
	void employeeCanAccessOnlyTheirOwnTicket() {
		UUID ownerId = UUID.randomUUID();
		UserPrincipal owner = principal(ownerId, "EMPLOYEE");
		Ticket ownTicket = ticketCreatedBy(ownerId);
		Ticket anotherTicket = ticketCreatedBy(UUID.randomUUID());

		ticketAccessService.requireCanAccess(owner, ownTicket);
		assertThatThrownBy(() -> ticketAccessService.requireCanAccess(owner, anotherTicket))
				.isInstanceOf(AccessDeniedException.class);
	}

	@Test
	void supportEngineerCanAccessTeamAndUnassignedQueueTickets() {
		UUID engineerId = UUID.randomUUID();
		UserPrincipal engineer = principal(engineerId, "SUPPORT_ENGINEER");
		UUID teamId = UUID.randomUUID();
		Ticket teamTicket = Ticket.builder()
				.createdBy(User.builder().id(UUID.randomUUID()).build())
				.supportTeam(SupportTeam.builder().id(teamId).build())
				.build();
		Ticket queueTicket = Ticket.builder()
				.createdBy(User.builder().id(UUID.randomUUID()).build())
				.build();
		when(teamMembershipRepository.existsByTeamIdAndUserId(teamId, engineerId)).thenReturn(true);

		ticketAccessService.requireCanAccess(engineer, teamTicket);
		ticketAccessService.requireCanAccess(engineer, queueTicket);
	}

	@Test
	void administratorCanAccessAnyTicket() {
		ticketAccessService.requireCanAccess(
				principal(UUID.randomUUID(), "ADMIN"),
				ticketCreatedBy(UUID.randomUUID()));
	}

	private Ticket ticketCreatedBy(UUID userId) {
		return Ticket.builder()
				.createdBy(User.builder().id(userId).build())
				.build();
	}

	private UserPrincipal principal(UUID userId, String role) {
		return new UserPrincipal(userId, "Test user", "test@example.test", "hash", role, true, Instant.now());
	}
}
