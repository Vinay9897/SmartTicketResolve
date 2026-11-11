package hcl.smart.ticket.event;

import java.util.UUID;

public record TicketCreatedEvent(UUID ticketId) {
}
