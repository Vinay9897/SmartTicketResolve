package hcl.smart.ticket.repository;

import java.util.Optional;
import java.util.List;
import java.util.UUID;

import hcl.smart.ticket.entity.User;
import hcl.smart.ticket.enums.UserRole;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface UserRepository extends JpaRepository<User, UUID> {

	Optional<User> findByEmail(String email);

	Optional<User> findByEmailIgnoreCase(String email);

	boolean existsByEmailIgnoreCaseAndIdNot(String email, UUID id);

	Page<User> findAll(Pageable pageable);

	@Query("""
			select user from User user
			where (:role is null or user.role = :role)
			  and (
			    lower(user.name) like lower(concat('%', :search, '%')) or
			    lower(user.email) like lower(concat('%', :search, '%')))
			""")
	Page<User> searchUsers(
			@Param("role") UserRole role,
			@Param("search") String search,
			Pageable pageable);

	@Query("""
			select supportEngineer from User supportEngineer
			where supportEngineer.role = :role
			  and supportEngineer.active = true
			  and (:teamId is null or exists (
			    select membership.id from TeamMembership membership
			    where membership.user.id = supportEngineer.id
			      and membership.team.id = :teamId
			      and membership.team.active = true
			  ))
			order by supportEngineer.name asc
			""")
	List<User> findActiveSupportEngineersForTeam(
			@Param("role") UserRole role, @Param("teamId") UUID teamId);
}
