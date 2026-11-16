package hcl.smart.ticket.repository;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

import hcl.smart.ticket.entity.SupportTeam;
import hcl.smart.ticket.entity.TeamMembership;
import hcl.smart.ticket.entity.Ticket;
import hcl.smart.ticket.entity.User;
import hcl.smart.ticket.enums.TicketPriority;
import hcl.smart.ticket.enums.TicketStatus;
import hcl.smart.ticket.enums.UserRole;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.boot.jdbc.test.autoconfigure.AutoConfigureTestDatabase;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.test.context.ActiveProfiles;

@DataJpaTest(properties = "spring.datasource.url=jdbc:h2:mem:smartresolve-repository-test;DB_CLOSE_DELAY=-1;MODE=PostgreSQL")
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@ActiveProfiles("test")
class TicketRepositoryDataJpaTest {

	@Autowired
	private TicketRepository ticketRepository;

	@Autowired
	private UserRepository userRepository;

	@Autowired
	private SupportTeamRepository supportTeamRepository;

	@Autowired
	private TeamMembershipRepository teamMembershipRepository;

	@Test
	void ownerAndSupportQueriesEnforceUserAndTeamBoundaries() {
		User owner = saveUser("owner", UserRole.EMPLOYEE);
		User otherOwner = saveUser("other-owner", UserRole.EMPLOYEE);
		User engineer = saveUser("engineer", UserRole.SUPPORT_ENGINEER);
		User otherEngineer = saveUser("other-engineer", UserRole.SUPPORT_ENGINEER);
		SupportTeam team = supportTeamRepository.saveAndFlush(SupportTeam.builder()
				.name("Team-" + UUID.randomUUID())
				.build());
		teamMembershipRepository.saveAndFlush(TeamMembership.builder().team(team).user(engineer).build());

		Ticket ownedTicket = saveTicket("owner ticket", owner, null, null, TicketPriority.MEDIUM);
		Ticket otherOwnerQueueTicket = saveTicket(
				"other owner's ticket", otherOwner, null, null, TicketPriority.MEDIUM);
		Ticket teamTicket = saveTicket("team ticket", otherOwner, null, team, TicketPriority.HIGH);
		Ticket assignedTicket = saveTicket("assigned ticket", otherOwner, engineer, null, TicketPriority.HIGH);
		saveTicket("other team ticket", otherOwner, null,
				supportTeamRepository.saveAndFlush(SupportTeam.builder()
						.name("Other-" + UUID.randomUUID())
						.build()),
				TicketPriority.HIGH);
		saveTicket("other engineer ticket", otherOwner, otherEngineer, null, TicketPriority.HIGH);
		Ticket unassignedTicket = saveTicket("unassigned ticket", otherOwner, null, null, TicketPriority.HIGH);

		Page<Ticket> ownerTickets = ticketRepository.findByCreatedById(owner.getId(), PageRequest.of(0, 10));
		assertThat(ownerTickets.getTotalElements()).isEqualTo(1);
		assertThat(ownerTickets.getContent().getFirst().getId()).isEqualTo(ownedTicket.getId());

		Page<Ticket> accessible = ticketRepository.findAccessibleToSupportEngineer(
				engineer.getId(), null, null, null, PageRequest.of(0, 10));
		assertThat(ids(accessible)).containsExactlyInAnyOrder(
				ownedTicket.getId(), otherOwnerQueueTicket.getId(),
				teamTicket.getId(), assignedTicket.getId(), unassignedTicket.getId());

		Page<Ticket> highOpen = ticketRepository.findAccessibleToSupportEngineer(
				engineer.getId(), null, TicketPriority.HIGH, TicketStatus.OPEN, PageRequest.of(0, 10));
		assertThat(ids(highOpen)).containsExactlyInAnyOrder(
				teamTicket.getId(), assignedTicket.getId(), unassignedTicket.getId());
		assertThat(highOpen.getTotalElements()).isEqualTo(3);
	}

	@Test
	void assignmentOptionsIncludeOnlyActiveEngineersAndActiveTeamMembers() {
		User teamEngineer = saveUser("team-engineer", UserRole.SUPPORT_ENGINEER);
		User otherEngineer = saveUser("other-engineer", UserRole.SUPPORT_ENGINEER);
		User employee = saveUser("employee", UserRole.EMPLOYEE);
		User inactiveEngineer = userRepository.saveAndFlush(User.builder()
				.name("inactive-engineer")
				.email("inactive-engineer-" + UUID.randomUUID() + "@example.test")
				.passwordHash("test-password-hash")
				.role(UserRole.SUPPORT_ENGINEER)
				.active(false)
				.build());
		SupportTeam activeTeam = supportTeamRepository.saveAndFlush(SupportTeam.builder()
				.name("Active-" + UUID.randomUUID())
				.build());
		SupportTeam inactiveTeam = supportTeamRepository.saveAndFlush(SupportTeam.builder()
				.name("Inactive-" + UUID.randomUUID())
				.active(false)
				.build());
		teamMembershipRepository.saveAndFlush(
				TeamMembership.builder().team(activeTeam).user(teamEngineer).build());
		teamMembershipRepository.saveAndFlush(
				TeamMembership.builder().team(inactiveTeam).user(otherEngineer).build());

		assertThat(userRepository.findActiveSupportEngineersForTeam(UserRole.SUPPORT_ENGINEER, null))
				.extracting(User::getId)
				.contains(teamEngineer.getId(), otherEngineer.getId())
				.doesNotContain(employee.getId(), inactiveEngineer.getId());
		assertThat(userRepository.findActiveSupportEngineersForTeam(
				UserRole.SUPPORT_ENGINEER, activeTeam.getId()))
				.extracting(User::getId)
				.containsExactly(teamEngineer.getId());
		assertThat(supportTeamRepository.findAllByActiveTrueOrderByNameAsc())
				.extracting(SupportTeam::getId)
				.contains(activeTeam.getId())
				.doesNotContain(inactiveTeam.getId());
	}

	private User saveUser(String prefix, UserRole role) {
		return userRepository.saveAndFlush(User.builder()
				.name(prefix)
				.email(prefix + "-" + UUID.randomUUID() + "@example.test")
				.passwordHash("test-password-hash")
				.role(role)
				.build());
	}

	private Ticket saveTicket(
			String title, User owner, User assignee, SupportTeam team, TicketPriority priority) {
		return ticketRepository.saveAndFlush(Ticket.builder()
				.title(title)
				.description("Repository isolation test")
				.priority(priority)
				.status(TicketStatus.OPEN)
				.createdBy(owner)
				.assignedTo(assignee)
				.supportTeam(team)
				.build());
	}

	private Set<UUID> ids(Page<Ticket> tickets) {
		return tickets.getContent().stream().map(Ticket::getId).collect(Collectors.toSet());
	}
}
