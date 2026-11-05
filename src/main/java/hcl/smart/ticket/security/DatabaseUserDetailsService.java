package hcl.smart.ticket.security;

import java.util.Locale;

import hcl.smart.ticket.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class DatabaseUserDetailsService implements UserDetailsService {

	private final UserRepository userRepository;

	@Override
	public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
		String normalizedEmail = email.trim().toLowerCase(Locale.ROOT);
		return userRepository.findByEmailIgnoreCase(normalizedEmail)
				.map(UserPrincipal::from)
				.orElseThrow(() -> new UsernameNotFoundException("Invalid email or password"));
	}
}
