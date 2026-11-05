package hcl.smart.ticket.exception;

public class AuthenticationFailureException extends RuntimeException {

	public AuthenticationFailureException() {
		super("Invalid email or password");
	}
}
