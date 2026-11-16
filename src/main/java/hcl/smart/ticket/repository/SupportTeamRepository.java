package hcl.smart.ticket.repository;

import java.util.Optional;
import java.util.UUID;

import hcl.smart.ticket.entity.SupportTeam;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface SupportTeamRepository extends JpaRepository<SupportTeam, UUID> {

	Optional<SupportTeam> findByName(String name);

	Optional<SupportTeam> findByNameIgnoreCase(String name);

	boolean existsByNameIgnoreCase(String name);

	boolean existsByNameIgnoreCaseAndIdNot(String name, UUID id);

	List<SupportTeam> findAllByOrderByNameAsc();

	List<SupportTeam> findAllByActiveTrueOrderByNameAsc();
}
