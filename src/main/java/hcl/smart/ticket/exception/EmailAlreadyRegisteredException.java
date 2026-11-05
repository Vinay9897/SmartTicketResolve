package hcl.smart.ticket.exception;

public class EmailAlreadyRegisteredException extends RuntimeException {

	public EmailAlreadyRegisteredException() {
		super("Email address is already registered");
	}
}
