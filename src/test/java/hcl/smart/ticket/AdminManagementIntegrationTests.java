package hcl.smart.ticket;

import static org.assertj.core.api.Assertions.assertThat;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Instant;
import java.util.UUID;

import hcl.smart.ticket.entity.SupportTeam;
import hcl.smart.ticket.entity.Ticket;
import hcl.smart.ticket.entity.TicketCategory;
import hcl.smart.ticket.entity.User;
import hcl.smart.ticket.enums.TicketPriority;
import hcl.smart.ticket.enums.TicketStatus;
import hcl.smart.ticket.enums.UserRole;
import hcl.smart.ticket.repository.SupportTeamRepository;
import hcl.smart.ticket.repository.TicketCategoryRepository;
import hcl.smart.ticket.repository.TicketRepository;
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
class AdminManagementIntegrationTests {

	private static final String PASSWORD = "Strong-password-123";

	@Autowired
	private ObjectMapper objectMapper;

	@Autowired
	private PasswordEncoder passwordEncoder;

	@Autowired
	private UserRepository userRepository;

	@Autowired
	private TicketCategoryRepository categoryRepository;

	@Autowired
	private SupportTeamRepository teamRepository;

	@Autowired
	private TicketRepository ticketRepository;

	@LocalServerPort
	private int port;

	@Test
	void adminManagesUsersWithoutExposingPasswordHashes() throws Exception {
		Auth admin = createUser("admin", UserRole.ADMIN);
		Auth employee = createUser("employee", UserRole.EMPLOYEE);
		String email = "managed-" + UUID.randomUUID() + "@example.test";
		String createBody = objectMapper.createObjectNode()
				.put("name", "Managed Engineer")
				.put("email", email)
				.put("password", PASSWORD)
				.put("role", "SUPPORT_ENGINEER")
				.toString();

		HttpResponse<String> denied = sendJson("POST", "/api/admin/users", createBody, employee.token());
		assertThat(denied.statusCode()).isEqualTo(403);

		HttpResponse<String> created = sendJson("POST", "/api/admin/users", createBody, admin.token());
		assertThat(created.statusCode()).isEqualTo(201);
		JsonNode userJson = objectMapper.readTree(created.body());
		assertThat(userJson.has("password")).isFalse();
		assertThat(userJson.has("passwordHash")).isFalse();
		User stored = userRepository.findByEmailIgnoreCase(email).orElseThrow();
		assertThat(passwordEncoder.matches(PASSWORD, stored.getPasswordHash())).isTrue();

		HttpResponse<String> updated = sendJson(
				"PUT",
				"/api/admin/users/" + stored.getId(),
				objectMapper.createObjectNode()
						.put("name", "Updated Engineer")
						.put("email", email)
						.put("role", "SUPPORT_ENGINEER")
						.put("password", "Replacement-password-456")
						.toString(),
				admin.token());
		assertThat(updated.statusCode()).isEqualTo(200);
		assertThat(objectMapper.readTree(updated.body()).path("name").asString()).isEqualTo("Updated Engineer");
		assertThat(passwordEncoder.matches(
				"Replacement-password-456",
				userRepository.findById(stored.getId()).orElseThrow().getPasswordHash())).isTrue();

		HttpResponse<String> listed = sendJson("GET", "/api/admin/users?page=0&size=10", null, admin.token());
		assertThat(listed.statusCode()).isEqualTo(200);
		assertThat(listed.body()).doesNotContain("passwordHash");
		assertThat(objectMapper.readTree(listed.body()).path("content").isArray()).isTrue();

		HttpResponse<String> duplicate = sendJson("POST", "/api/admin/users", createBody, admin.token());
		assertThat(duplicate.statusCode()).isEqualTo(409);

		HttpResponse<String> disabled = sendJson(
				"PATCH",
				"/api/admin/users/" + stored.getId() + "/status",
				objectMapper.createObjectNode().put("active", false).toString(),
				admin.token());
		assertThat(disabled.statusCode()).isEqualTo(200);
		assertThat(objectMapper.readTree(disabled.body()).path("active").booleanValue()).isFalse();
	}

	@Test
	void adminManagesCategoriesAndTeamsWithDuplicateValidationAndSoftDeletion() throws Exception {
		Auth admin = createUser("catalog-admin", UserRole.ADMIN);
		Auth engineer = createUser("catalog-engineer", UserRole.SUPPORT_ENGINEER);
		String categoryName = "Category-" + UUID.randomUUID();
		String categoryBody = objectMapper.createObjectNode()
				.put("name", categoryName)
				.put("description", "Example category")
				.toString();

		HttpResponse<String> categoryResponse = sendJson(
				"POST", "/api/admin/categories", categoryBody, admin.token());
		assertThat(categoryResponse.statusCode()).isEqualTo(201);
		String categoryId = objectMapper.readTree(categoryResponse.body()).path("id").asString();
		assertThat(sendJson("POST", "/api/admin/categories",
				objectMapper.createObjectNode().put("name", categoryName.toUpperCase()).toString(),
				admin.token()).statusCode()).isEqualTo(409);
		assertThat(sendJson("GET", "/api/admin/categories", null, engineer.token()).statusCode()).isEqualTo(403);
		assertThat(sendJson("PUT", "/api/admin/categories/" + categoryId,
				objectMapper.createObjectNode().put("name", categoryName + "-updated").toString(),
				admin.token()).statusCode()).isEqualTo(200);
		assertThat(sendJson("DELETE", "/api/admin/categories/" + categoryId, null, admin.token()).statusCode())
				.isEqualTo(204);
		assertThat(categoryRepository.findById(UUID.fromString(categoryId)).orElseThrow().isActive()).isFalse();
		assertThat(sendJson("PUT", "/api/admin/categories/" + categoryId,
				objectMapper.createObjectNode().put("name", categoryName + "-updated").put("active", true).toString(),
				admin.token()).statusCode()).isEqualTo(200);
		assertThat(categoryRepository.findById(UUID.fromString(categoryId)).orElseThrow().isActive()).isTrue();

		String teamName = "Team-" + UUID.randomUUID();
		String teamBody = objectMapper.createObjectNode().put("name", teamName).toString();
		HttpResponse<String> teamResponse = sendJson("POST", "/api/admin/teams", teamBody, admin.token());
		assertThat(teamResponse.statusCode()).isEqualTo(201);
		String teamId = objectMapper.readTree(teamResponse.body()).path("id").asString();
		assertThat(sendJson("POST", "/api/admin/teams",
				objectMapper.createObjectNode().put("name", teamName.toUpperCase()).toString(),
				admin.token()).statusCode()).isEqualTo(409);
		assertThat(sendJson("PUT", "/api/admin/teams/" + teamId,
				objectMapper.createObjectNode().put("name", teamName + "-updated").toString(),
				admin.token()).statusCode()).isEqualTo(200);
		assertThat(sendJson("DELETE", "/api/admin/teams/" + teamId, null, admin.token()).statusCode())
				.isEqualTo(204);
		assertThat(teamRepository.findById(UUID.fromString(teamId)).orElseThrow().isActive()).isFalse();
		assertThat(sendJson("PUT", "/api/admin/teams/" + teamId,
				objectMapper.createObjectNode().put("name", teamName + "-updated").put("active", true).toString(),
				admin.token()).statusCode()).isEqualTo(200);
	}

	@Test
	void adminDashboardReturnsAggregatedCountsAndRejectsOtherRoles() throws Exception {
		Auth admin = createUser("dashboard-admin", UserRole.ADMIN);
		Auth employee = createUser("dashboard-employee", UserRole.EMPLOYEE);
		TicketCategory category = categoryRepository.saveAndFlush(TicketCategory.builder()
				.name("Dashboard-" + UUID.randomUUID())
				.build());
		SupportTeam team = teamRepository.saveAndFlush(SupportTeam.builder()
				.name("Dashboard-" + UUID.randomUUID())
				.build());
		User creator = userRepository.findById(UUID.fromString(employee.id())).orElseThrow();
		ticketRepository.saveAndFlush(Ticket.builder()
				.title("Dashboard aggregation test")
				.description("Ticket for dashboard aggregate integration coverage")
				.category(category)
				.supportTeam(team)
				.createdBy(creator)
				.priority(TicketPriority.HIGH)
				.status(TicketStatus.IN_PROGRESS)
				.createdAt(Instant.now())
				.updatedAt(Instant.now())
				.build());

		assertThat(sendJson("GET", "/api/admin/dashboard/summary", null, employee.token()).statusCode())
				.isEqualTo(403);
		HttpResponse<String> summary = sendJson("GET", "/api/admin/dashboard/summary", null, admin.token());
		assertThat(summary.statusCode()).isEqualTo(200);
		assertThat(objectMapper.readTree(summary.body()).path("totalTickets").longValue()).isGreaterThan(0);
		assertThat(objectMapper.readTree(summary.body()).path("inProgressTickets").longValue()).isGreaterThan(0);

		JsonNode priorities = objectMapper.readTree(sendJson(
				"GET", "/api/admin/dashboard/tickets-by-priority", null, admin.token()).body());
		assertThat(findCount(priorities, "HIGH")).isGreaterThan(0);
		JsonNode statuses = objectMapper.readTree(sendJson(
				"GET", "/api/admin/dashboard/tickets-by-status", null, admin.token()).body());
		assertThat(findCount(statuses, "IN_PROGRESS")).isGreaterThan(0);
		JsonNode categories = objectMapper.readTree(sendJson(
				"GET", "/api/admin/dashboard/tickets-by-category", null, admin.token()).body());
		assertThat(findCount(categories, category.getName())).isGreaterThan(0);
		JsonNode teams = objectMapper.readTree(sendJson(
				"GET", "/api/admin/dashboard/tickets-by-support-team", null, admin.token()).body());
		assertThat(findCount(teams, team.getName())).isGreaterThan(0);
	}

	private long findCount(JsonNode values, String name) {
		for (JsonNode value : values) {
			if (name.equals(value.path("name").asString())) {
				return value.path("count").longValue();
			}
		}
		return 0;
	}

	private Auth createUser(String prefix, UserRole role) throws Exception {
		String email = prefix + "-" + UUID.randomUUID() + "@example.test";
		User user = userRepository.saveAndFlush(User.builder()
				.name(prefix)
				.email(email)
				.passwordHash(passwordEncoder.encode(PASSWORD))
				.role(role)
				.build());
		HttpResponse<String> response = sendJson("POST", "/api/auth/login",
				objectMapper.createObjectNode().put("email", email).put("password", PASSWORD).toString(),
				null);
		assertThat(response.statusCode()).isEqualTo(200);
		String token = objectMapper.readTree(response.body()).path("accessToken").asString();
		return new Auth(user.getId().toString(), token);
	}

	private HttpResponse<String> sendJson(String method, String path, String body, String token) throws Exception {
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

	private record Auth(String id, String token) {
	}
}
