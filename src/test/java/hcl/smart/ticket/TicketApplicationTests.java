package hcl.smart.ticket;

import static org.assertj.core.api.Assertions.assertThat;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.UUID;

import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.test.context.ActiveProfiles;

import hcl.smart.ticket.entity.SupportTeam;
import hcl.smart.ticket.entity.TeamMembership;
import hcl.smart.ticket.entity.Ticket;
import hcl.smart.ticket.entity.TicketAiAnalysis;
import hcl.smart.ticket.entity.TicketAssignment;
import hcl.smart.ticket.entity.TicketCategory;
import hcl.smart.ticket.entity.TicketComment;
import hcl.smart.ticket.entity.TicketStatusHistory;
import hcl.smart.ticket.entity.User;
import hcl.smart.ticket.enums.AiAnalysisStatus;
import hcl.smart.ticket.enums.CommentVisibility;
import hcl.smart.ticket.enums.TicketPriority;
import hcl.smart.ticket.enums.TicketStatus;
import hcl.smart.ticket.enums.UserRole;
import hcl.smart.ticket.repository.SupportTeamRepository;
import hcl.smart.ticket.repository.TeamMembershipRepository;
import hcl.smart.ticket.repository.TicketAiAnalysisRepository;
import hcl.smart.ticket.repository.TicketAssignmentRepository;
import hcl.smart.ticket.repository.TicketCategoryRepository;
import hcl.smart.ticket.repository.TicketCommentRepository;
import hcl.smart.ticket.repository.TicketRepository;
import hcl.smart.ticket.repository.TicketStatusHistoryRepository;
import hcl.smart.ticket.repository.UserRepository;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
class TicketApplicationTests {

	@Autowired
	private ObjectMapper objectMapper;

	@Autowired
	private JdbcTemplate jdbcTemplate;

	@Autowired
	private PasswordEncoder passwordEncoder;

	@Autowired
	private UserRepository userRepository;

	@Autowired
	private TicketCategoryRepository ticketCategoryRepository;

	@Autowired
	private SupportTeamRepository supportTeamRepository;

	@Autowired
	private TeamMembershipRepository teamMembershipRepository;

	@Autowired
	private TicketRepository ticketRepository;

	@Autowired
	private TicketCommentRepository ticketCommentRepository;

	@Autowired
	private TicketAssignmentRepository ticketAssignmentRepository;

	@Autowired
	private TicketStatusHistoryRepository ticketStatusHistoryRepository;

	@Autowired
	private TicketAiAnalysisRepository ticketAiAnalysisRepository;

	@LocalServerPort
	private int port;

	@Test
	void healthEndpointResponds() throws Exception {
		HttpRequest request = HttpRequest.newBuilder()
				.uri(URI.create("http://localhost:" + port + "/actuator/health"))
				.GET()
				.build();
		HttpResponse<String> response = HttpClient.newHttpClient()
				.send(request, HttpResponse.BodyHandlers.ofString());

		assertThat(response.statusCode()).isEqualTo(200);
		assertThat(response.body()).contains("\"status\":\"UP\"");
	}

	@Test
	void schemaScriptCreatesAllEntityTables() {
		Integer tableCount = jdbcTemplate.queryForObject("""
				SELECT COUNT(*)
				FROM INFORMATION_SCHEMA.TABLES
				WHERE TABLE_SCHEMA = 'PUBLIC'
				  AND TABLE_NAME IN (
				    'USERS', 'TICKET_CATEGORIES', 'SUPPORT_TEAMS', 'TEAM_MEMBERSHIPS',
				    'TICKETS', 'TICKET_COMMENTS', 'TICKET_ASSIGNMENTS',
				    'TICKET_STATUS_HISTORY', 'TICKET_AI_ANALYSES'
				  )
				""", Integer.class);

		assertThat(tableCount).isEqualTo(9);
	}

	@Test
	@Transactional
	void entityRelationshipsPersistAcrossSchema() {
		User employee = userRepository.saveAndFlush(User.builder()
				.name("Employee")
				.email("employee@example.test")
				.passwordHash("test-password-hash")
				.role(UserRole.EMPLOYEE)
				.build());
		User engineer = userRepository.saveAndFlush(User.builder()
				.name("Engineer")
				.email("engineer@example.test")
				.passwordHash("test-password-hash")
				.role(UserRole.SUPPORT_ENGINEER)
				.build());
		TicketCategory category = ticketCategoryRepository.saveAndFlush(TicketCategory.builder()
				.name("Hardware")
				.build());
		SupportTeam team = supportTeamRepository.saveAndFlush(SupportTeam.builder()
				.name("Service Desk")
				.build());
		teamMembershipRepository.saveAndFlush(TeamMembership.builder()
				.team(team)
				.user(engineer)
				.build());
		Ticket ticket = ticketRepository.saveAndFlush(Ticket.builder()
				.title("Laptop issue")
				.description("The laptop does not start.")
				.category(category)
				.priority(TicketPriority.HIGH)
				.status(TicketStatus.OPEN)
				.createdBy(employee)
				.assignedTo(engineer)
				.supportTeam(team)
				.build());

		ticketCommentRepository.saveAndFlush(TicketComment.builder()
				.ticket(ticket)
				.user(employee)
				.comment("The issue started today.")
				.visibility(CommentVisibility.PUBLIC)
				.build());
		ticketAssignmentRepository.saveAndFlush(TicketAssignment.builder()
				.ticket(ticket)
				.assignedBy(engineer)
				.assignedTo(engineer)
				.supportTeam(team)
				.build());
		ticketStatusHistoryRepository.saveAndFlush(TicketStatusHistory.builder()
				.ticket(ticket)
				.changedBy(engineer)
				.toStatus(TicketStatus.OPEN)
				.build());
		ticketAiAnalysisRepository.saveAndFlush(TicketAiAnalysis.builder()
				.ticket(ticket)
				.suggestedCategory(category)
				.suggestedPriority(TicketPriority.HIGH)
				.issueSummary("Laptop does not start.")
				.status(AiAnalysisStatus.COMPLETED)
				.build());

		Ticket persistedTicket = ticketRepository.findById(ticket.getId()).orElseThrow();
		assertThat(persistedTicket.getCreatedBy().getId()).isEqualTo(employee.getId());
		assertThat(persistedTicket.getAssignedTo().getId()).isEqualTo(engineer.getId());
		assertThat(persistedTicket.getCategory().getId()).isEqualTo(category.getId());
		assertThat(teamMembershipRepository.existsByTeamIdAndUserId(team.getId(), engineer.getId())).isTrue();
	}

	@Test
	void registrationLoginAndAuthorizationWorkEndToEnd() throws Exception {
		assertThat(sendJson("GET", "/api/auth/me", null, null).statusCode()).isEqualTo(401);

		String email = "employee-" + UUID.randomUUID() + "@example.test";
		String password = "Strong-password-123";
		HttpResponse<String> registration = sendJson("POST", "/api/auth/register",
				objectMapper.createObjectNode()
						.put("name", "New Employee")
						.put("email", email)
						.put("password", password)
						.put("role", "ADMIN")
						.toString(),
				null);

		assertThat(registration.statusCode()).isEqualTo(201);
		JsonNode registrationBody = objectMapper.readTree(registration.body());
		assertThat(registrationBody.path("user").path("role").asString()).isEqualTo("EMPLOYEE");
		assertThat(registrationBody.has("password")).isFalse();
		assertThat(registrationBody.path("user").has("passwordHash")).isFalse();
		User registeredUser = userRepository.findByEmailIgnoreCase(email).orElseThrow();
		assertThat(registeredUser.getPasswordHash()).isNotEqualTo(password);
		assertThat(passwordEncoder.matches(password, registeredUser.getPasswordHash())).isTrue();
		String accessToken = registrationBody.path("accessToken").asString();
		assertThat(accessToken).isNotBlank();
		assertThat(registrationBody.path("expiresIn").asLong()).isEqualTo(900);

		HttpResponse<String> profile = sendJson("GET", "/api/auth/me", null, accessToken);
		assertThat(profile.statusCode()).isEqualTo(200);
		assertThat(objectMapper.readTree(profile.body()).path("email").asString()).isEqualTo(email);

		HttpResponse<String> adminEndpoint = sendJson("GET", "/api/admin/users", null, accessToken);
		assertThat(adminEndpoint.statusCode()).isEqualTo(403);

		HttpResponse<String> login = sendJson("POST", "/api/auth/login",
				objectMapper.createObjectNode()
						.put("email", email.toUpperCase(java.util.Locale.ROOT))
						.put("password", password)
						.toString(),
				null);
		assertThat(login.statusCode()).isEqualTo(200);

		HttpResponse<String> invalidLogin = sendJson("POST", "/api/auth/login",
				objectMapper.createObjectNode()
						.put("email", email)
						.put("password", "incorrect-password")
						.toString(),
				null);
		assertThat(invalidLogin.statusCode()).isEqualTo(401);
	}

	@Test
	void supportEngineerAndAdminRolesPassTheirRouteGuards() throws Exception {
		String password = "Strong-password-123";
		User engineer = userRepository.saveAndFlush(User.builder()
				.name("Support Engineer")
				.email("engineer-" + UUID.randomUUID() + "@example.test")
				.passwordHash(passwordEncoder.encode(password))
				.role(UserRole.SUPPORT_ENGINEER)
				.build());
		User admin = userRepository.saveAndFlush(User.builder()
				.name("Administrator")
				.email("admin-" + UUID.randomUUID() + "@example.test")
				.passwordHash(passwordEncoder.encode(password))
				.role(UserRole.ADMIN)
				.build());

		String engineerToken = loginAndGetToken(engineer.getEmail(), password);
		String adminToken = loginAndGetToken(admin.getEmail(), password);

		assertThat(sendJson("GET", "/api/engineer/queue", null, engineerToken).statusCode()).isEqualTo(404);
		assertThat(sendJson("GET", "/api/admin/users", null, adminToken).statusCode()).isEqualTo(404);
	}

	@Test
	void inactiveUsersCannotLoginOrUsePreviouslyIssuedTokens() throws Exception {
		String email = "inactive-" + UUID.randomUUID() + "@example.test";
		String password = "Strong-password-123";
		HttpResponse<String> registration = sendJson("POST", "/api/auth/register",
				objectMapper.createObjectNode()
						.put("name", "Inactive Employee")
						.put("email", email)
						.put("password", password)
						.toString(),
				null);
		assertThat(registration.statusCode()).isEqualTo(201);
		String accessToken = objectMapper.readTree(registration.body()).path("accessToken").asString();

		User user = userRepository.findByEmailIgnoreCase(email).orElseThrow();
		user.setActive(false);
		userRepository.saveAndFlush(user);

		HttpResponse<String> login = sendJson("POST", "/api/auth/login",
				objectMapper.createObjectNode()
						.put("email", email)
						.put("password", password)
						.toString(),
				null);
		assertThat(login.statusCode()).isEqualTo(401);

		HttpResponse<String> profile = sendJson("GET", "/api/auth/me", null, accessToken);
		assertThat(profile.statusCode()).isEqualTo(401);
	}

	@Test
	void registrationValidatesInputAndRejectsDuplicateEmail() throws Exception {
		String email = "duplicate-" + UUID.randomUUID() + "@example.test";
		String body = objectMapper.createObjectNode()
				.put("name", "Employee")
				.put("email", email)
				.put("password", "Strong-password-123")
				.toString();

		assertThat(sendJson("POST", "/api/auth/register", body, null).statusCode()).isEqualTo(201);
		assertThat(sendJson("POST", "/api/auth/register", body, null).statusCode()).isEqualTo(409);

		String invalidBody = objectMapper.createObjectNode()
				.put("name", "")
				.put("email", "invalid")
				.put("password", "short")
				.toString();
		assertThat(sendJson("POST", "/api/auth/register", invalidBody, null).statusCode()).isEqualTo(400);
	}

	private HttpResponse<String> sendJson(String method, String path, String body, String token) throws Exception {
		HttpRequest.Builder request = HttpRequest.newBuilder()
				.uri(URI.create("http://localhost:" + port + path))
				.header(HttpHeaders.ACCEPT, MediaType.APPLICATION_JSON_VALUE);
		if (body != null) {
			request.header(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
					.method(method, HttpRequest.BodyPublishers.ofString(body));
		} else {
			request.method(method, HttpRequest.BodyPublishers.noBody());
		}
		if (token != null) {
			request.header(HttpHeaders.AUTHORIZATION, "Bearer " + token);
		}
		return HttpClient.newHttpClient().send(request.build(), HttpResponse.BodyHandlers.ofString());
	}

	private String loginAndGetToken(String email, String password) throws Exception {
		HttpResponse<String> response = sendJson("POST", "/api/auth/login",
				objectMapper.createObjectNode().put("email", email).put("password", password).toString(),
				null);
		assertThat(response.statusCode()).isEqualTo(200);
		return objectMapper.readTree(response.body()).path("accessToken").asString();
	}

}
