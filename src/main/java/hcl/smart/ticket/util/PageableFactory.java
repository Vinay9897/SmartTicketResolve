package hcl.smart.ticket.util;

import java.util.Set;

import hcl.smart.ticket.exception.InvalidRequestException;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

public final class PageableFactory {

	private static final int MAX_PAGE_SIZE = 100;
	private static final Set<String> TICKET_SORT_FIELDS =
			Set.of("createdAt", "updatedAt", "priority", "status", "title");

	private PageableFactory() {
	}

	public static Pageable tickets(int page, int size, String sortBy, Sort.Direction direction) {
		if (page < 0 || size < 1 || size > MAX_PAGE_SIZE || !TICKET_SORT_FIELDS.contains(sortBy)) {
			throw new InvalidRequestException(
					"Use a non-negative page, a page size from 1 to 100, and a supported ticket sort field");
		}
		return PageRequest.of(page, size, Sort.by(direction, sortBy));
	}

	public static Pageable comments(int page, int size) {
		if (page < 0 || size < 1 || size > MAX_PAGE_SIZE) {
			throw new InvalidRequestException("Use a non-negative page and a page size from 1 to 100");
		}
		return PageRequest.of(page, size, Sort.by(Sort.Direction.ASC, "createdAt"));
	}
}
