package hcl.smart.ticket.dto.response;

import java.util.UUID;

public record DashboardCountResponse(String key, UUID id, String name, long count) {
}
