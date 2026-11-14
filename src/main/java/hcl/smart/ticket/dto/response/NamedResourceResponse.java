package hcl.smart.ticket.dto.response;

import java.util.UUID;

public record NamedResourceResponse(UUID id, String name, String description, boolean active) {
}
