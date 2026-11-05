package hcl.smart.ticket.config;

import hcl.smart.ticket.dto.response.ApiErrorResponse;
import hcl.smart.ticket.security.JwtToUserAuthenticationConverter;
import hcl.smart.ticket.security.DatabaseUserDetailsService;
import jakarta.servlet.http.HttpServletResponse;
import java.time.Instant;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.ProviderManager;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.web.SecurityFilterChain;
import tools.jackson.databind.ObjectMapper;

@Configuration
@EnableMethodSecurity
public class SecurityConfiguration {

	@Bean
	PasswordEncoder passwordEncoder() {
		return new BCryptPasswordEncoder();
	}

	@Bean
	AuthenticationManager authenticationManager(
			DatabaseUserDetailsService userDetailsService,
			PasswordEncoder passwordEncoder) {
		DaoAuthenticationProvider provider = new DaoAuthenticationProvider(userDetailsService);
		provider.setPasswordEncoder(passwordEncoder);
		return new ProviderManager(provider);
	}

	@Bean
	SecurityFilterChain securityFilterChain(
			HttpSecurity http,
			JwtToUserAuthenticationConverter jwtConverter,
			ObjectMapper objectMapper) throws Exception {
		return http
				.csrf(csrf -> csrf.disable())
				.formLogin(form -> form.disable())
				.httpBasic(basic -> basic.disable())
				.sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
				.authorizeHttpRequests(authorize -> authorize
						.requestMatchers(HttpMethod.POST, "/api/auth/register", "/api/auth/login").permitAll()
						.requestMatchers("/swagger-ui/**", "/swagger-ui.html", "/v3/api-docs/**", "/actuator/health")
						.permitAll()
						.requestMatchers("/api/admin/**").hasRole("ADMIN")
						.requestMatchers("/api/engineer/**").hasAnyRole("SUPPORT_ENGINEER", "ADMIN")
						.anyRequest().authenticated())
				.exceptionHandling(exceptions -> exceptions
						.authenticationEntryPoint((request, response, exception) ->
								writeSecurityError(objectMapper, response, HttpServletResponse.SC_UNAUTHORIZED,
										"Unauthorized", "Authentication is required", request.getRequestURI()))
						.accessDeniedHandler((request, response, exception) ->
								writeSecurityError(objectMapper, response, HttpServletResponse.SC_FORBIDDEN,
										"Forbidden", "You do not have permission to access this resource",
										request.getRequestURI())))
				.oauth2ResourceServer(resourceServer -> resourceServer
						.jwt(jwt -> jwt.jwtAuthenticationConverter(jwtConverter)))
				.build();
	}

	private void writeSecurityError(
			ObjectMapper objectMapper,
			HttpServletResponse response,
			int status,
			String error,
			String message,
			String path) throws java.io.IOException {
		response.setStatus(status);
		response.setContentType(MediaType.APPLICATION_JSON_VALUE);
		objectMapper.writeValue(response.getOutputStream(),
				new ApiErrorResponse(Instant.now(), status, error, message, path));
	}
}
