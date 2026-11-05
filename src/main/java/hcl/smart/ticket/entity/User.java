package hcl.smart.ticket.entity;

import java.time.Instant;
import java.util.UUID;

import hcl.smart.ticket.enums.UserRole;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "users", uniqueConstraints = {
		@UniqueConstraint(name = "uk_users_email", columnNames = "email")
}, indexes = {
		@Index(name = "idx_users_role_active", columnList = "role, active")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class User {

	@Id
	@GeneratedValue(strategy = GenerationType.UUID)
	private UUID id;

	@NotBlank
	@Size(max = 160)
	@Column(nullable = false, length = 160)
	private String name;

	@NotBlank
	@Email
	@Size(max = 254)
	@Column(nullable = false, length = 254)
	private String email;

	@NotBlank
	@Size(max = 255)
	@Column(name = "password_hash", nullable = false, length = 255)
	private String passwordHash;

	@NotNull
	@Enumerated(EnumType.STRING)
	@Column(nullable = false, length = 30)
	private UserRole role;

	@Builder.Default
	@Column(nullable = false)
	private boolean active = true;

	@NotNull
	@Builder.Default
	@Column(nullable = false, updatable = false)
	private Instant createdAt = Instant.now();

	@NotNull
	@Builder.Default
	@Column(nullable = false)
	private Instant updatedAt = Instant.now();

	@PrePersist
	private void setCreationTimestamps() {
		Instant now = Instant.now();
		if (createdAt == null) {
			createdAt = now;
		}
		if (updatedAt == null) {
			updatedAt = now;
		}
	}

	@PreUpdate
	private void updateTimestamp() {
		updatedAt = Instant.now();
	}
}
