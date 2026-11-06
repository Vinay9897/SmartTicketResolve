package hcl.smart.ticket.repository;

import java.util.UUID;

import hcl.smart.ticket.entity.TicketComment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TicketCommentRepository extends JpaRepository<TicketComment, UUID> {

	Page<TicketComment> findByTicketId(UUID ticketId, Pageable pageable);

	Page<TicketComment> findByTicketIdAndVisibility(
			UUID ticketId,
			hcl.smart.ticket.enums.CommentVisibility visibility,
			Pageable pageable);
}
