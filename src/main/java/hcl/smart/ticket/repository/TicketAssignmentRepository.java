package hcl.smart.ticket.repository;

import java.util.UUID;

import hcl.smart.ticket.entity.TicketAssignment;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TicketAssignmentRepository extends JpaRepository<TicketAssignment, UUID> {
}
