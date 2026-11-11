package hcl.smart.ticket.repository;

import java.util.UUID;

import hcl.smart.ticket.entity.TicketAiAnalysis;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface TicketAiAnalysisRepository extends JpaRepository<TicketAiAnalysis, UUID> {

	Optional<TicketAiAnalysis> findFirstByTicketIdOrderByCreatedAtDesc(UUID ticketId);

	Optional<TicketAiAnalysis> findByIdAndTicketId(UUID id, UUID ticketId);
}
