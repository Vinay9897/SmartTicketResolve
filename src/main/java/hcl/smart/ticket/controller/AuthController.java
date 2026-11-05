package hcl.smart.ticket.controller;

import hcl.smart.ticket.dto.request.LoginRequest;
import hcl.smart.ticket.dto.request.RegisterRequest;
import hcl.smart.ticket.dto.response.AuthResponse;
import hcl.smart.ticket.dto.response.UserResponse;
import hcl.smart.ticket.security.UserPrincipal;
import hcl.smart.ticket.service.AuthenticationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

	private final AuthenticationService authenticationService;

	@PostMapping("/register")
	@ResponseStatus(HttpStatus.CREATED)
	public AuthResponse register(@Valid @RequestBody RegisterRequest request) {
		return authenticationService.register(request);
	}

	@PostMapping("/login")
	public AuthResponse login(@Valid @RequestBody LoginRequest request) {
		return authenticationService.login(request);
	}

	@GetMapping("/me")
	public UserResponse currentUser(@AuthenticationPrincipal UserPrincipal principal) {
		return authenticationService.currentUser(principal);
	}
}
