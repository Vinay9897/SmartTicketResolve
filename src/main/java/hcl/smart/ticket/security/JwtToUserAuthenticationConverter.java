package hcl.smart.ticket.security;

import lombok.RequiredArgsConstructor;
import org.springframework.core.convert.converter.Converter;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class JwtToUserAuthenticationConverter implements Converter<Jwt, AbstractAuthenticationToken> {

	private final UserDetailsService userDetailsService;

	@Override
	public AbstractAuthenticationToken convert(Jwt jwt) {
		UserDetails user = userDetailsService.loadUserByUsername(jwt.getSubject());
		if (!user.isEnabled()) {
			throw new DisabledException("Account is inactive");
		}
		return new UsernamePasswordAuthenticationToken(user, jwt, user.getAuthorities());
	}
}
