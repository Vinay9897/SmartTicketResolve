package hcl.smart.ticket.repository;

import java.util.UUID;
import java.util.List;

import hcl.smart.ticket.entity.Ticket;
import hcl.smart.ticket.enums.TicketPriority;
import hcl.smart.ticket.enums.TicketStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface TicketRepository extends JpaRepository<Ticket, UUID> {

	Page<Ticket> findByCreatedById(UUID createdById, Pageable pageable);

	@Query("select ticket.status, count(ticket) from Ticket ticket group by ticket.status")
	List<Object[]> countTicketsByStatus();

	@Query("select ticket.priority, count(ticket) from Ticket ticket group by ticket.priority")
	List<Object[]> countTicketsByPriority();

	@Query("""
			select category.id, category.name, count(ticket)
			from TicketCategory category left join Ticket ticket on ticket.category = category
			group by category.id, category.name
			order by category.name
			""")
	List<Object[]> countTicketsByCategory();

	@Query("""
			select team.id, team.name, count(ticket)
			from SupportTeam team left join Ticket ticket on ticket.supportTeam = team
			group by team.id, team.name
			order by team.name
			""")
	List<Object[]> countTicketsBySupportTeam();

	long countByCategoryIsNull();

	long countBySupportTeamIsNull();

	long countByStatus(TicketStatus status);

	@Query(
			value = """
					select t from Ticket t
					where (:categoryId is null or t.category.id = :categoryId)
					  and (:priority is null or t.priority = :priority)
					  and (:status is null or t.status = :status)
					  and (
					    t.assignedTo.id = :userId
					    or exists (
					      select membership.id from TeamMembership membership
					      where membership.team.id = t.supportTeam.id
					        and membership.user.id = :userId
					    )
					    or (t.assignedTo is null and t.supportTeam is null)
					  )
					""",
			countQuery = """
					select count(t) from Ticket t
					where (:categoryId is null or t.category.id = :categoryId)
					  and (:priority is null or t.priority = :priority)
					  and (:status is null or t.status = :status)
					  and (
					    t.assignedTo.id = :userId
					    or exists (
					      select membership.id from TeamMembership membership
					      where membership.team.id = t.supportTeam.id
					        and membership.user.id = :userId
					    )
					    or (t.assignedTo is null and t.supportTeam is null)
					  )
					""")
	Page<Ticket> findAccessibleToSupportEngineer(
			@Param("userId") UUID userId,
			@Param("categoryId") UUID categoryId,
			@Param("priority") TicketPriority priority,
			@Param("status") TicketStatus status,
			Pageable pageable);
}
