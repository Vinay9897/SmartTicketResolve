package hcl.smart.ticket.config;

import java.nio.charset.StandardCharsets;
import java.time.Duration;

import com.nimbusds.jose.proc.SecurityContext;
import com.nimbusds.jose.jwk.source.ImmutableSecret;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtEncoder;

@Configuration
public class JwtConfiguration {

	@Bean
	JwtDecoder jwtDecoder(@Value("${smartresolve.security.jwt.secret}") String secret) {
		byte[] key = validateSecret(secret);
		return NimbusJwtDecoder.withSecretKey(new javax.crypto.spec.SecretKeySpec(key, "HmacSHA256"))
				.macAlgorithm(MacAlgorithm.HS256)
				.build();
	}

	@Bean
	JwtEncoder jwtEncoder(@Value("${smartresolve.security.jwt.secret}") String secret) {
		return new NimbusJwtEncoder(new ImmutableSecret<SecurityContext>(validateSecret(secret)));
	}

	@Bean
	Duration accessTokenTtl(@Value("${smartresolve.security.jwt.access-token-ttl:PT15M}") Duration ttl) {
		if (ttl.isZero() || ttl.isNegative()) {
			throw new IllegalArgumentException("JWT access-token TTL must be positive");
		}
		return ttl;
	}

	private byte[] validateSecret(String secret) {
		byte[] key = secret.getBytes(StandardCharsets.UTF_8);
		if (key.length < 32) {
			throw new IllegalArgumentException("SMARTRESOLVE_JWT_SECRET must contain at least 32 UTF-8 bytes");
		}
		return key;
	}
}
