package hcl.smart.ticket.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfiguration {

	@Bean
	OpenAPI smartResolveOpenApi() {
		return new OpenAPI()
				.info(new Info()
						.title("SmartResolve API")
						.description("REST API for SmartResolve")
						.version("v1"));
	}
}
