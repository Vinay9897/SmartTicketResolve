package hcl.smart.ticket.repository;

import java.util.Optional;
import java.util.UUID;

import hcl.smart.ticket.entity.TicketCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface TicketCategoryRepository extends JpaRepository<TicketCategory, UUID> {

	Optional<TicketCategory> findByName(String name);

	Optional<TicketCategory> findByNameIgnoreCase(String name);

	boolean existsByNameIgnoreCase(String name);

	boolean existsByNameIgnoreCaseAndIdNot(String name, UUID id);

	List<TicketCategory> findByActiveTrueOrderByNameAsc();

	List<TicketCategory> findAllByOrderByNameAsc();
}
