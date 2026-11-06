package hcl.smart.ticket.repository;

import java.util.UUID;

import hcl.smart.ticket.entity.TicketAssignment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface TicketAssignmentRepository extends JpaRepository<TicketAssignment, UUID> {

	Page<TicketAssignment> findByTicketIdOrderByAssignedAtDesc(UUID ticketId, Pageable pageable);
}
