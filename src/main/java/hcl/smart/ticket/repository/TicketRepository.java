package hcl.smart.ticket.repository;

import java.util.UUID;

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
