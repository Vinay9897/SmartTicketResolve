package hcl.smart.ticket.controller;

import java.util.UUID;

import hcl.smart.ticket.dto.request.AdminCreateUserRequest;
import hcl.smart.ticket.dto.request.AdminUpdateUserRequest;
import hcl.smart.ticket.dto.request.UpdateUserStatusRequest;
import hcl.smart.ticket.dto.response.PageResponse;
import hcl.smart.ticket.dto.response.UserResponse;
import hcl.smart.ticket.security.UserPrincipal;
import hcl.smart.ticket.service.UserManagementService;
import hcl.smart.ticket.util.PageableFactory;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/users")
@RequiredArgsConstructor
public class AdminUserController {

	private final UserManagementService userManagementService;

	@GetMapping
	public PageResponse<UserResponse> getUsers(
			@AuthenticationPrincipal UserPrincipal principal,
			@RequestParam(defaultValue = "0") int page,
			@RequestParam(defaultValue = "20") int size,
			@RequestParam(defaultValue = "createdAt") String sortBy,
			@RequestParam(defaultValue = "DESC") Sort.Direction direction) {
		return userManagementService.findUsers(
				principal, PageableFactory.users(page, size, sortBy, direction));
	}

	@GetMapping("/{id}")
	public UserResponse getUser(
			@AuthenticationPrincipal UserPrincipal principal,
			@PathVariable UUID id) {
		return userManagementService.getUser(principal, id);
	}

	@PostMapping
	@ResponseStatus(HttpStatus.CREATED)
	public UserResponse createUser(
			@AuthenticationPrincipal UserPrincipal principal,
			@Valid @RequestBody AdminCreateUserRequest request) {
		return userManagementService.createUser(principal, request);
	}

	@PutMapping("/{id}")
	public UserResponse updateUser(
			@AuthenticationPrincipal UserPrincipal principal,
			@PathVariable UUID id,
			@Valid @RequestBody AdminUpdateUserRequest request) {
		return userManagementService.updateUser(principal, id, request);
	}

	@PatchMapping("/{id}/status")
	public UserResponse updateUserStatus(
			@AuthenticationPrincipal UserPrincipal principal,
			@PathVariable UUID id,
			@Valid @RequestBody UpdateUserStatusRequest request) {
		return userManagementService.updateStatus(principal, id, request);
	}
}
