package hcl.smart.ticket.exception;

public class TicketNotFoundException extends RuntimeException {

	public TicketNotFoundException() {
		super("Ticket was not found or is not accessible");
	}
}
