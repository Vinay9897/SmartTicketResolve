package hcl.smart.ticket.repository;

import java.util.UUID;

import hcl.smart.ticket.entity.TeamMembership;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TeamMembershipRepository extends JpaRepository<TeamMembership, UUID> {

	boolean existsByTeamIdAndUserId(UUID teamId, UUID userId);
}
