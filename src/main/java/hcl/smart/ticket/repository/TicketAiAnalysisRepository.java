package hcl.smart.ticket.repository;

import java.util.UUID;

import hcl.smart.ticket.entity.TicketAiAnalysis;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TicketAiAnalysisRepository extends JpaRepository<TicketAiAnalysis, UUID> {
}
