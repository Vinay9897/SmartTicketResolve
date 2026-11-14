package hcl.smart.ticket.controller;

import java.util.List;
import java.util.UUID;

import hcl.smart.ticket.dto.request.SaveNamedResourceRequest;
import hcl.smart.ticket.dto.response.NamedResourceResponse;
import hcl.smart.ticket.security.UserPrincipal;
import hcl.smart.ticket.service.CatalogManagementService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/categories")
@RequiredArgsConstructor
public class AdminCategoryController {

	private final CatalogManagementService catalogManagementService;

	@PostMapping
	@ResponseStatus(HttpStatus.CREATED)
	public NamedResourceResponse createCategory(
			@AuthenticationPrincipal UserPrincipal principal,
			@Valid @RequestBody SaveNamedResourceRequest request) {
		return catalogManagementService.createCategory(principal, request);
	}

	@GetMapping
	public List<NamedResourceResponse> getCategories(@AuthenticationPrincipal UserPrincipal principal) {
		return catalogManagementService.getCategories(principal);
	}

	@PutMapping("/{id}")
	public NamedResourceResponse updateCategory(
			@AuthenticationPrincipal UserPrincipal principal,
			@PathVariable UUID id,
			@Valid @RequestBody SaveNamedResourceRequest request) {
		return catalogManagementService.updateCategory(principal, id, request);
	}

	@DeleteMapping("/{id}")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public void deleteCategory(
			@AuthenticationPrincipal UserPrincipal principal,
			@PathVariable UUID id) {
		catalogManagementService.deactivateCategory(principal, id);
	}
}
