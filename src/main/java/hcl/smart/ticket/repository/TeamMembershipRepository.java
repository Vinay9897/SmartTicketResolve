package hcl.smart.ticket.repository;

import java.util.UUID;
import java.util.List;

import hcl.smart.ticket.entity.TeamMembership;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface TeamMembershipRepository extends JpaRepository<TeamMembership, UUID> {

	boolean existsByTeamIdAndUserId(UUID teamId, UUID userId);

	boolean existsByUserId(UUID userId);

	@Query("""
			select membership from TeamMembership membership
			join fetch membership.user teamMember
			where membership.team.id = :teamId
			order by lower(teamMember.name), teamMember.id
			""")
	List<TeamMembership> findAllByTeamIdWithUserOrderByUserName(@Param("teamId") UUID teamId);

	java.util.Optional<TeamMembership> findByTeamIdAndUserId(UUID teamId, UUID userId);
}
