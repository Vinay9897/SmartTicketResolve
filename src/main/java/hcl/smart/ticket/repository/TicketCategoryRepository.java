package hcl.smart.ticket.repository;

import java.util.Optional;
import java.util.UUID;

import hcl.smart.ticket.entity.TicketCategory;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TicketCategoryRepository extends JpaRepository<TicketCategory, UUID> {

	Optional<TicketCategory> findByName(String name);
}
