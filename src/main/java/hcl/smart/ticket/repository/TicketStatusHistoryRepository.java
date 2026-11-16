package hcl.smart.ticket.repository;

import java.util.UUID;

import hcl.smart.ticket.entity.TicketStatusHistory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TicketStatusHistoryRepository extends JpaRepository<TicketStatusHistory, UUID> {

	Page<TicketStatusHistory> findByTicketId(UUID ticketId, Pageable pageable);
}
