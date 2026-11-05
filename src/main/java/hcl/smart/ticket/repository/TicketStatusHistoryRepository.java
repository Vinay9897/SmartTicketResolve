package hcl.smart.ticket.repository;

import java.util.UUID;

import hcl.smart.ticket.entity.TicketStatusHistory;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TicketStatusHistoryRepository extends JpaRepository<TicketStatusHistory, UUID> {
}
