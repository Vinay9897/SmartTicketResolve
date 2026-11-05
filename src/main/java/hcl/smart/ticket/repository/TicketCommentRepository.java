package hcl.smart.ticket.repository;

import java.util.UUID;

import hcl.smart.ticket.entity.TicketComment;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TicketCommentRepository extends JpaRepository<TicketComment, UUID> {
}
