package hcl.smart.ticket;

import static org.assertj.core.api.Assertions.assertThat;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.UUID;

import hcl.smart.ticket.entity.SupportTeam;
import hcl.smart.ticket.entity.TeamMembership;
import hcl.smart.ticket.entity.User;
import hcl.smart.ticket.enums.UserRole;
import hcl.smart.ticket.repository.SupportTeamRepository;
import hcl.smart.ticket.repository.TeamMembershipRepository;
import hcl.smart.ticket.repository.TicketAssignmentRepository;
import hcl.smart.ticket.repository.TicketRepository;
import hcl.smart.ticket.repository.TicketStatusHistoryRepository;
import hcl.smart.ticket.repository.UserRepository;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
class TicketManagementIntegrationTests {

	private static final String PASSWORD = "Strong-password-123";

	@Autowired
	private ObjectMapper objectMapper;

	@Autowired
	private UserRepository userRepository;

	@Autowired
	private SupportTeamRepository supportTeamRepository;

	@Autowired
	private TeamMembershipRepository teamMembershipRepository;

	@Autowired
	private TicketRepository ticketRepository;

	@Autowired
	private TicketAssignmentRepository ticketAssignmentRepository;

	@Autowired
	private TicketStatusHistoryRepository ticketStatusHistoryRepository;

	@Autowired
	private PasswordEncoder passwordEncoder;

	@LocalServerPort
	private int port;

	@Test
	void employeeCreatesAndViewsOwnTicketAndCannotReadAnotherEmployeesTicket() throws Exception {
		Auth employee = registerEmployee("employee");
		Auth otherEmployee = registerEmployee("other");
		String createBody = objectMapper.createObjectNode()
				.put("title", "Cannot access email")
				.put("description", "Outlook reports a connection failure.")
				.toString();
		HttpResponse<String> created = send("POST", "/api/tickets", createBody, employee.token());

		assertThat(created.statusCode()).isEqualTo(201);
		JsonNode ticket = objectMapper.readTree(created.body());
		String ticketId = ticket.path("id").asString();
		assertThat(ticket.path("status").asString()).isEqualTo("OPEN");
		assertThat(ticket.path("priority").asString()).isEqualTo("MEDIUM");
		assertThat(ticket.path("createdById").asString()).isEqualTo(employee.id());
		assertThat(ticket.path("updatedAt").asString()).isNotBlank();

		HttpResponse<String> myTickets = send("GET", "/api/tickets/my?page=0&size=10&sortBy=createdAt&direction=DESC",
				null, employee.token());
		assertThat(myTickets.statusCode()).isEqualTo(200);
		assertThat(objectMapper.readTree(myTickets.body()).path("totalElements").intValue()).isEqualTo(1);

		assertThat(send("GET", "/api/tickets/" + ticketId, null, employee.token()).statusCode()).isEqualTo(200);
		assertThat(send("GET", "/api/tickets/" + ticketId, null, otherEmployee.token()).statusCode())
				.isEqualTo(403);

		HttpResponse<String> invalidCreate = send("POST", "/api/tickets",
				objectMapper.createObjectNode().put("title", "").put("description", "").toString(),
				employee.token());
		assertThat(invalidCreate.statusCode()).isEqualTo(400);

		HttpResponse<String> comment = send("POST", "/api/tickets/" + ticketId + "/comments",
				objectMapper.createObjectNode().put("comment", "I restarted the device.").toString(),
				employee.token());
		assertThat(comment.statusCode()).isEqualTo(201);
		HttpResponse<String> comments = send("GET", "/api/tickets/" + ticketId + "/comments", null, employee.token());
		assertThat(objectMapper.readTree(comments.body()).path("totalElements").intValue()).isEqualTo(1);

		HttpResponse<String> internalComment = send("POST", "/api/tickets/" + ticketId + "/comments",
				objectMapper.createObjectNode()
						.put("comment", "Internal note")
						.put("visibility", "INTERNAL")
						.toString(),
				employee.token());
		assertThat(internalComment.statusCode()).isEqualTo(409);
	}

	@Test
	void supportEngineerAssignsFiltersResolvesAndCannotUpdateClosedTicket() throws Exception {
		Auth employee = registerEmployee("ticket-owner");
		Auth engineer = createUser("engineer", UserRole.SUPPORT_ENGINEER);
		Auth outsider = createUser("outsider-engineer", UserRole.SUPPORT_ENGINEER);
		SupportTeam team = supportTeamRepository.saveAndFlush(SupportTeam.builder()
				.name("Team-" + UUID.randomUUID())
				.build());
		teamMembershipRepository.saveAndFlush(TeamMembership.builder()
				.team(team)
				.user(userRepository.findById(UUID.fromString(engineer.id())).orElseThrow())
				.build());
		HttpResponse<String> created = send("POST", "/api/tickets",
				objectMapper.createObjectNode()
						.put("title", "VPN unavailable")
						.put("description", "VPN connection times out.")
						.put("priority", "HIGH")
						.toString(),
				employee.token());
		String ticketId = objectMapper.readTree(created.body()).path("id").asString();

		HttpResponse<String> employeeAssignment = send("PUT", "/api/support/tickets/" + ticketId + "/assign",
				objectMapper.createObjectNode().put("assignedToId", employee.id()).toString(),
				engineer.token());
		assertThat(employeeAssignment.statusCode()).isEqualTo(409);

		HttpResponse<String> nonMemberAssignment = send("PUT", "/api/support/tickets/" + ticketId + "/assign",
				objectMapper.createObjectNode()
						.put("assignedToId", outsider.id())
						.put("supportTeamId", team.getId().toString())
						.toString(),
				engineer.token());
		assertThat(nonMemberAssignment.statusCode()).isEqualTo(409);

		HttpResponse<String> assigned = send("PUT", "/api/support/tickets/" + ticketId + "/assign",
				objectMapper.createObjectNode()
						.put("assignedToId", engineer.id())
						.put("supportTeamId", team.getId().toString())
						.toString(),
				engineer.token());
		assertThat(assigned.statusCode()).isEqualTo(200);
		assertThat(ticketAssignmentRepository.count()).isGreaterThanOrEqualTo(1);
		assertThat(send("GET", "/api/support/tickets/" + ticketId, null, outsider.token()).statusCode())
				.isEqualTo(403);

		HttpResponse<String> filtered = send("GET",
				"/api/support/tickets/filter?priority=HIGH&status=OPEN&page=0&size=10",
				null, engineer.token());
		assertThat(filtered.statusCode()).isEqualTo(200);
		assertThat(objectMapper.readTree(filtered.body()).path("totalElements").intValue()).isEqualTo(1);

		HttpResponse<String> internalComment = send("POST", "/api/tickets/" + ticketId + "/comments",
				objectMapper.createObjectNode()
						.put("comment", "Internal support-only troubleshooting note.")
						.put("visibility", "INTERNAL")
						.toString(),
				engineer.token());
		assertThat(internalComment.statusCode()).isEqualTo(201);
		HttpResponse<String> employeeComments = send(
				"GET", "/api/tickets/" + ticketId + "/comments", null, employee.token());
		assertThat(objectMapper.readTree(employeeComments.body()).path("totalElements").intValue()).isZero();

		HttpResponse<String> inProgress = send("PUT", "/api/support/tickets/" + ticketId + "/status",
				objectMapper.createObjectNode().put("status", "IN_PROGRESS").toString(),
				engineer.token());
		assertThat(inProgress.statusCode()).isEqualTo(200);
		HttpResponse<String> invalidTransition = send("PUT", "/api/support/tickets/" + ticketId + "/status",
				objectMapper.createObjectNode().put("status", "CLOSED").toString(),
				engineer.token());
		assertThat(invalidTransition.statusCode()).isEqualTo(409);

		HttpResponse<String> resolved = send("PUT", "/api/support/tickets/" + ticketId + "/resolve",
				objectMapper.createObjectNode().put("resolutionNotes", "Reset the VPN profile.").toString(),
				engineer.token());
		assertThat(resolved.statusCode()).isEqualTo(200);
		assertThat(objectMapper.readTree(resolved.body()).path("status").asString()).isEqualTo("RESOLVED");

		HttpResponse<String> closed = send("PUT", "/api/support/tickets/" + ticketId + "/status",
				objectMapper.createObjectNode().put("status", "CLOSED").toString(),
				engineer.token());
		assertThat(closed.statusCode()).isEqualTo(200);
		assertThat(send("PUT", "/api/support/tickets/" + ticketId + "/assign",
				objectMapper.createObjectNode().put("assignedToId", engineer.id()).toString(),
				engineer.token()).statusCode()).isEqualTo(409);
		assertThat(send("POST", "/api/tickets/" + ticketId + "/comments",
				objectMapper.createObjectNode().put("comment", "Late comment").toString(),
				employee.token()).statusCode()).isEqualTo(409);
		assertThat(ticketStatusHistoryRepository.count()).isGreaterThanOrEqualTo(4);
	}

	@Test
	void adminCanListAllTicketsAndEmployeesCannotUseSupportOperations() throws Exception {
		Auth admin = createUser("admin", UserRole.ADMIN);
		Auth employee = registerEmployee("plain-employee");
		HttpResponse<String> created = send("POST", "/api/tickets",
				objectMapper.createObjectNode()
						.put("title", "Printer issue")
						.put("description", "Printer is offline.")
						.toString(),
				employee.token());
		String ticketId = objectMapper.readTree(created.body()).path("id").asString();

		assertThat(send("GET", "/api/admin/tickets?page=0&size=10", null, admin.token()).statusCode())
				.isEqualTo(200);
		assertThat(send("GET", "/api/admin/tickets/" + ticketId, null, admin.token()).statusCode())
				.isEqualTo(200);
		assertThat(send("GET", "/api/admin/tickets", null, employee.token()).statusCode())
				.isEqualTo(403);
		assertThat(send("GET", "/api/support/tickets", null, employee.token()).statusCode())
				.isEqualTo(403);
		assertThat(send("PUT", "/api/support/tickets/" + ticketId + "/status",
				objectMapper.createObjectNode().put("status", "IN_PROGRESS").toString(),
				employee.token()).statusCode()).isEqualTo(403);
		assertThat(send("GET", "/api/tickets/my?page=0&size=200", null, employee.token()).statusCode())
				.isEqualTo(400);
	}

	private Auth registerEmployee(String prefix) throws Exception {
		String email = prefix + "-" + UUID.randomUUID() + "@example.test";
		HttpResponse<String> response = send("POST", "/api/auth/register",
				objectMapper.createObjectNode()
						.put("name", prefix)
						.put("email", email)
						.put("password", PASSWORD)
						.toString(),
				null);
		assertThat(response.statusCode()).isEqualTo(201);
		JsonNode body = objectMapper.readTree(response.body());
		return new Auth(body.path("user").path("id").asString(), body.path("accessToken").asString(), email);
	}

	private Auth createUser(String prefix, UserRole role) throws Exception {
		String email = prefix + "-" + UUID.randomUUID() + "@example.test";
		User user = userRepository.saveAndFlush(User.builder()
				.name(prefix)
				.email(email)
				.passwordHash(passwordEncoder.encode(PASSWORD))
				.role(role)
				.build());
		HttpResponse<String> response = send("POST", "/api/auth/login",
				objectMapper.createObjectNode()
						.put("email", email)
						.put("password", PASSWORD)
						.toString(),
				null);
		assertThat(response.statusCode()).isEqualTo(200);
		String token = objectMapper.readTree(response.body()).path("accessToken").asString();
		return new Auth(user.getId().toString(), token, email);
	}

	private HttpResponse<String> send(String method, String path, String body, String token) throws Exception {
		HttpRequest.Builder request = HttpRequest.newBuilder()
				.uri(URI.create("http://localhost:" + port + path))
				.header(HttpHeaders.ACCEPT, MediaType.APPLICATION_JSON_VALUE);
		if (body == null) {
			request.method(method, HttpRequest.BodyPublishers.noBody());
		} else {
			request.header(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
					.method(method, HttpRequest.BodyPublishers.ofString(body));
		}
		if (token != null) {
			request.header(HttpHeaders.AUTHORIZATION, "Bearer " + token);
		}
		return HttpClient.newHttpClient().send(request.build(), HttpResponse.BodyHandlers.ofString());
	}

	private record Auth(String id, String token, String email) {
	}
}
