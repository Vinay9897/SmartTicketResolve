package hcl.smart.ticket.repository;

import java.util.Optional;
import java.util.UUID;

import hcl.smart.ticket.entity.SupportTeam;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SupportTeamRepository extends JpaRepository<SupportTeam, UUID> {

	Optional<SupportTeam> findByName(String name);
}
