package hcl.smart.ticket.repository;

import java.util.Optional;
import java.util.UUID;

import hcl.smart.ticket.entity.SupportTeam;
import hcl.smart.ticket.dto.response.SupportTeamOverviewResponse;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.List;

public interface SupportTeamRepository extends JpaRepository<SupportTeam, UUID> {

	Optional<SupportTeam> findByName(String name);

	Optional<SupportTeam> findByNameIgnoreCase(String name);

	boolean existsByNameIgnoreCase(String name);

	boolean existsByNameIgnoreCaseAndIdNot(String name, UUID id);

	List<SupportTeam> findAllByOrderByNameAsc();

	List<SupportTeam> findAllByActiveTrueOrderByNameAsc();

	@Query("""
			select new hcl.smart.ticket.dto.response.SupportTeamOverviewResponse(
				team.id, team.name, team.description, team.active, count(membership.id))
			from SupportTeam team
			left join TeamMembership membership on membership.team = team
			group by team.id, team.name, team.description, team.active
			order by team.name
			""")
	List<SupportTeamOverviewResponse> findAllTeamOverviews();
}
