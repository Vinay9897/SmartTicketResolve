package hcl.smart.ticket.dto.request;

import hcl.smart.ticket.enums.UserRole;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record AdminUpdateUserRequest(
		@NotBlank @Size(max = 160) String name,
		@NotBlank @Email @Size(max = 254) String email,
		@NotNull UserRole role,
		@Size(min = 12, max = 72) String password) {
}
