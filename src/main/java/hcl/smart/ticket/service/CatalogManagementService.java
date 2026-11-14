package hcl.smart.ticket.service;

import java.util.List;
import java.util.UUID;

import hcl.smart.ticket.dto.request.SaveNamedResourceRequest;
import hcl.smart.ticket.dto.response.NamedResourceResponse;
import hcl.smart.ticket.entity.SupportTeam;
import hcl.smart.ticket.entity.TicketCategory;
import hcl.smart.ticket.exception.TicketNotFoundException;
import hcl.smart.ticket.exception.TicketOperationException;
import hcl.smart.ticket.repository.SupportTeamRepository;
import hcl.smart.ticket.repository.TicketCategoryRepository;
import hcl.smart.ticket.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class CatalogManagementService {

	private final TicketCategoryRepository categoryRepository;
	private final SupportTeamRepository teamRepository;
	private final AdminAuthorizationService authorizationService;

	@Transactional
	public NamedResourceResponse createCategory(UserPrincipal actor, SaveNamedResourceRequest request) {
		authorizationService.requireAdmin(actor);
		String name = normalizedName(request.name());
		if (categoryRepository.existsByNameIgnoreCase(name)) {
			throw new TicketOperationException("A ticket category with that name already exists");
		}
		return toResponse(categoryRepository.save(TicketCategory.builder()
				.name(name)
				.description(normalizedDescription(request.description()))
				.active(true)
				.build()));
	}

	@Transactional(readOnly = true)
	public List<NamedResourceResponse> getCategories(UserPrincipal actor) {
		authorizationService.requireAdmin(actor);
		return categoryRepository.findAllByOrderByNameAsc().stream().map(CatalogManagementService::toResponse).toList();
	}

	@Transactional
	public NamedResourceResponse updateCategory(
			UserPrincipal actor, UUID id, SaveNamedResourceRequest request) {
		authorizationService.requireAdmin(actor);
		TicketCategory category = categoryRepository.findById(id).orElseThrow(TicketNotFoundException::new);
		String name = normalizedName(request.name());
		if (!name.equalsIgnoreCase(category.getName())
				&& categoryRepository.existsByNameIgnoreCaseAndIdNot(name, id)) {
			throw new TicketOperationException("A ticket category with that name already exists");
		}
		category.setName(name);
		category.setDescription(normalizedDescription(request.description()));
		if (request.active() != null) {
			category.setActive(request.active());
		}
		return toResponse(categoryRepository.save(category));
	}

	@Transactional
	public void deactivateCategory(UserPrincipal actor, UUID id) {
		authorizationService.requireAdmin(actor);
		TicketCategory category = categoryRepository.findById(id).orElseThrow(TicketNotFoundException::new);
		category.setActive(false);
		categoryRepository.save(category);
	}

	@Transactional
	public NamedResourceResponse createTeam(UserPrincipal actor, SaveNamedResourceRequest request) {
		authorizationService.requireAdmin(actor);
		String name = normalizedName(request.name());
		if (teamRepository.existsByNameIgnoreCase(name)) {
			throw new TicketOperationException("A support team with that name already exists");
		}
		return toResponse(teamRepository.save(SupportTeam.builder()
				.name(name)
				.description(normalizedDescription(request.description()))
				.active(true)
				.build()));
	}

	@Transactional(readOnly = true)
	public List<NamedResourceResponse> getTeams(UserPrincipal actor) {
		authorizationService.requireAdmin(actor);
		return teamRepository.findAllByOrderByNameAsc().stream().map(CatalogManagementService::toResponse).toList();
	}

	@Transactional
	public NamedResourceResponse updateTeam(UserPrincipal actor, UUID id, SaveNamedResourceRequest request) {
		authorizationService.requireAdmin(actor);
		SupportTeam team = teamRepository.findById(id).orElseThrow(TicketNotFoundException::new);
		String name = normalizedName(request.name());
		if (!name.equalsIgnoreCase(team.getName()) && teamRepository.existsByNameIgnoreCaseAndIdNot(name, id)) {
			throw new TicketOperationException("A support team with that name already exists");
		}
		team.setName(name);
		team.setDescription(normalizedDescription(request.description()));
		if (request.active() != null) {
			team.setActive(request.active());
		}
		return toResponse(teamRepository.save(team));
	}

	@Transactional
	public void deactivateTeam(UserPrincipal actor, UUID id) {
		authorizationService.requireAdmin(actor);
		SupportTeam team = teamRepository.findById(id).orElseThrow(TicketNotFoundException::new);
		team.setActive(false);
		teamRepository.save(team);
	}

	private String normalizedName(String name) {
		return name.trim();
	}

	private String normalizedDescription(String description) {
		return description == null || description.isBlank() ? null : description.trim();
	}

	private static NamedResourceResponse toResponse(TicketCategory category) {
		return new NamedResourceResponse(category.getId(), category.getName(), category.getDescription(),
				category.isActive());
	}

	private static NamedResourceResponse toResponse(SupportTeam team) {
		return new NamedResourceResponse(team.getId(), team.getName(), team.getDescription(), team.isActive());
	}
}
