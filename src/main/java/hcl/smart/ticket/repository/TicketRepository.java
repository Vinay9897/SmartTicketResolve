package hcl.smart.ticket.repository;

import java.util.UUID;

import hcl.smart.ticket.entity.Ticket;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TicketRepository extends JpaRepository<Ticket, UUID> {
}
