package hcl.smart.ticket.service;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;

import hcl.smart.ticket.dto.response.AuthResponse;
import hcl.smart.ticket.dto.response.UserResponse;
import hcl.smart.ticket.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class JwtTokenService {

	private static final String ISSUER = "smartresolve";

	private final JwtEncoder jwtEncoder;
	private final Duration accessTokenTtl;

	public AuthResponse issueToken(UserPrincipal user) {
		Instant issuedAt = Instant.now(Clock.systemUTC());
		Instant expiresAt = issuedAt.plus(accessTokenTtl);
		JwtClaimsSet claims = JwtClaimsSet.builder()
				.issuer(ISSUER)
				.subject(user.email())
				.issuedAt(issuedAt)
				.expiresAt(expiresAt)
				.claim("userId", user.id().toString())
				.claim("role", user.role())
				.build();
		String token = jwtEncoder.encode(JwtEncoderParameters.from(
				JwsHeader.with(MacAlgorithm.HS256).build(),
				claims)).getTokenValue();

		return new AuthResponse(
				token,
				"Bearer",
				accessTokenTtl.toSeconds(),
				UserResponse.from(user));
	}
}
