package hcl.smart.ticket.exception;

import java.time.Instant;

import hcl.smart.ticket.dto.response.ApiErrorResponse;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationServiceException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {

	@ExceptionHandler(AuthenticationFailureException.class)
	public ResponseEntity<ApiErrorResponse> handleAuthenticationFailure(
			AuthenticationFailureException exception,
			HttpServletRequest request) {
		return error(HttpStatus.UNAUTHORIZED, exception.getMessage(), request);
	}

	@ExceptionHandler(EmailAlreadyRegisteredException.class)
	public ResponseEntity<ApiErrorResponse> handleDuplicateEmail(
			EmailAlreadyRegisteredException exception,
			HttpServletRequest request) {
		return error(HttpStatus.CONFLICT, exception.getMessage(), request);
	}

	@ExceptionHandler(PasswordTooLongException.class)
	public ResponseEntity<ApiErrorResponse> handlePasswordTooLong(
			PasswordTooLongException exception,
			HttpServletRequest request) {
		return error(HttpStatus.BAD_REQUEST, exception.getMessage(), request);
	}

	@ExceptionHandler(DataIntegrityViolationException.class)
	public ResponseEntity<ApiErrorResponse> handleDataConflict(HttpServletRequest request) {
		return error(HttpStatus.CONFLICT, "The request conflicts with an existing record", request);
	}

	@ExceptionHandler(MethodArgumentNotValidException.class)
	public ResponseEntity<ApiErrorResponse> handleValidation(
			MethodArgumentNotValidException exception,
			HttpServletRequest request) {
		String message = exception.getBindingResult().getFieldErrors().stream()
				.findFirst()
				.map(error -> error.getField() + " " + error.getDefaultMessage())
				.orElse("Request validation failed");
		return error(HttpStatus.BAD_REQUEST, message, request);
	}

	@ExceptionHandler(AuthenticationServiceException.class)
	public ResponseEntity<ApiErrorResponse> handleAuthenticationServiceFailure(
			AuthenticationServiceException exception,
			HttpServletRequest request) {
		return error(HttpStatus.INTERNAL_SERVER_ERROR, "Authentication could not be completed", request);
	}

	private ResponseEntity<ApiErrorResponse> error(
			HttpStatus status,
			String message,
			HttpServletRequest request) {
		return ResponseEntity.status(status).body(new ApiErrorResponse(
				Instant.now(),
				status.value(),
				status.getReasonPhrase(),
				message,
				request.getRequestURI()));
	}
}
