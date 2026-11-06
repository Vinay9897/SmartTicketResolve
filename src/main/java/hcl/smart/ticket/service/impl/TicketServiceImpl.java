package hcl.smart.ticket.service.impl;

import java.time.Instant;
import java.util.UUID;

import hcl.smart.ticket.dto.request.AddTicketCommentRequest;
import hcl.smart.ticket.dto.request.AssignTicketRequest;
import hcl.smart.ticket.dto.request.ChangeTicketStatusRequest;
import hcl.smart.ticket.dto.request.CreateTicketRequest;
import hcl.smart.ticket.dto.request.ResolveTicketRequest;
import hcl.smart.ticket.dto.response.PageResponse;
import hcl.smart.ticket.dto.response.TicketCommentResponse;
import hcl.smart.ticket.dto.response.TicketResponse;
import hcl.smart.ticket.entity.SupportTeam;
import hcl.smart.ticket.entity.Ticket;
import hcl.smart.ticket.entity.TicketAssignment;
import hcl.smart.ticket.entity.TicketCategory;
import hcl.smart.ticket.entity.TicketComment;
import hcl.smart.ticket.entity.TicketStatusHistory;
import hcl.smart.ticket.entity.User;
import hcl.smart.ticket.enums.CommentVisibility;
import hcl.smart.ticket.enums.TicketPriority;
import hcl.smart.ticket.enums.TicketStatus;
import hcl.smart.ticket.enums.UserRole;
import hcl.smart.ticket.exception.TicketNotFoundException;
import hcl.smart.ticket.exception.TicketOperationException;
import hcl.smart.ticket.mapper.TicketMapper;
import hcl.smart.ticket.repository.SupportTeamRepository;
import hcl.smart.ticket.repository.TicketAssignmentRepository;
import hcl.smart.ticket.repository.TicketCategoryRepository;
import hcl.smart.ticket.repository.TicketCommentRepository;
import hcl.smart.ticket.repository.TicketRepository;
import hcl.smart.ticket.repository.TicketStatusHistoryRepository;
import hcl.smart.ticket.repository.UserRepository;
import hcl.smart.ticket.security.UserPrincipal;
import hcl.smart.ticket.service.TicketAccessService;
import hcl.smart.ticket.service.TicketService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class TicketServiceImpl implements TicketService {

	private final TicketRepository ticketRepository;
	private final TicketCategoryRepository categoryRepository;
	private final SupportTeamRepository supportTeamRepository;
	private final TicketCommentRepository commentRepository;
	private final TicketAssignmentRepository assignmentRepository;
	private final TicketStatusHistoryRepository statusHistoryRepository;
	private final UserRepository userRepository;
	private final TicketAccessService ticketAccessService;
	private final TicketMapper ticketMapper;

	@Override
	@Transactional
	public TicketResponse createTicket(UserPrincipal actor, CreateTicketRequest request) {
		requireRole(actor, UserRole.EMPLOYEE);
		User creator = findActiveUser(actor.id());
		TicketCategory category = request.categoryId() == null
				? null
				: findActiveCategory(request.categoryId());
		Ticket ticket = Ticket.builder()
				.title(request.title().trim())
				.description(request.description().trim())
				.category(category)
				.priority(request.priority() == null ? TicketPriority.MEDIUM : request.priority())
				.status(TicketStatus.OPEN)
				.createdBy(creator)
				.build();
		Ticket savedTicket = ticketRepository.saveAndFlush(ticket);
		recordStatusChange(savedTicket, null, TicketStatus.OPEN, actor.id(), "Ticket created");
		return ticketMapper.toResponse(savedTicket);
	}

	@Override
	@Transactional(readOnly = true)
	public PageResponse<TicketResponse> findMyTickets(UserPrincipal actor, Pageable pageable) {
		requireRole(actor, UserRole.EMPLOYEE);
		return mapTickets(ticketRepository.findByCreatedById(actor.id(), pageable));
	}

	@Override
	@Transactional(readOnly = true)
	public TicketResponse getTicket(UserPrincipal actor, UUID ticketId) {
		Ticket ticket = findAccessibleTicket(actor, ticketId);
		return ticketMapper.toResponse(ticket);
	}

	@Override
	@Transactional(readOnly = true)
	public TicketResponse getSupportTicket(UserPrincipal actor, UUID ticketId) {
		requireSupportRole(actor);
		return ticketMapper.toResponse(findAccessibleTicket(actor, ticketId));
	}

	@Override
	@Transactional(readOnly = true)
	public TicketResponse getAdminTicket(UserPrincipal actor, UUID ticketId) {
		requireRole(actor, UserRole.ADMIN);
		return ticketRepository.findById(ticketId)
				.map(ticketMapper::toResponse)
				.orElseThrow(TicketNotFoundException::new);
	}

	@Override
	@Transactional(readOnly = true)
	public PageResponse<TicketResponse> findSupportTickets(
			UserPrincipal actor,
			UUID categoryId,
			TicketPriority priority,
			TicketStatus status,
			Pageable pageable) {
		requireSupportRole(actor);
		Page<Ticket> tickets = ticketRepository.findAccessibleToSupportEngineer(
				actor.id(), categoryId, priority, status, pageable);
		return mapTickets(tickets);
	}

	@Override
	@Transactional(readOnly = true)
	public PageResponse<TicketResponse> findAdminTickets(UserPrincipal actor, Pageable pageable) {
		requireRole(actor, UserRole.ADMIN);
		return mapTickets(ticketRepository.findAll(pageable));
	}

	@Override
	@Transactional
	public TicketResponse changeStatus(
			UserPrincipal actor, UUID ticketId, ChangeTicketStatusRequest request) {
		requireSupportRole(actor);
		Ticket ticket = findAccessibleTicket(actor, ticketId);
		requireOpenForUpdate(ticket);
		TicketStatus currentStatus = ticket.getStatus();
		TicketStatus nextStatus = request.status();
		if (!isAllowedTransition(currentStatus, nextStatus, ticket.getResolutionNotes())) {
			throw new TicketOperationException(
					"Ticket status cannot transition from " + currentStatus + " to " + nextStatus);
		}
		ticket.setStatus(nextStatus);
		if (nextStatus == TicketStatus.CLOSED && ticket.getResolvedAt() == null) {
			ticket.setResolvedAt(Instant.now());
		}
		recordStatusChange(ticket, currentStatus, nextStatus, actor.id(), request.note());
		return ticketMapper.toResponse(ticketRepository.saveAndFlush(ticket));
	}

	@Override
	@Transactional
	public TicketResponse assignTicket(UserPrincipal actor, UUID ticketId, AssignTicketRequest request) {
		requireSupportRole(actor);
		Ticket ticket = findAccessibleTicket(actor, ticketId);
		requireOpenForUpdate(ticket);
		User assignee = findActiveUser(request.assignedToId());
		if (assignee.getRole() != UserRole.SUPPORT_ENGINEER) {
			throw new TicketOperationException("Tickets can only be assigned to active support engineers");
		}

		SupportTeam team = request.supportTeamId() == null ? null : findActiveTeam(request.supportTeamId());
		if (team != null && !teamMembershipMatches(team.getId(), assignee.getId())) {
			throw new TicketOperationException("The selected engineer is not a member of the support team");
		}

		ticket.setAssignedTo(assignee);
		ticket.setSupportTeam(team);
		assignmentRepository.save(TicketAssignment.builder()
				.ticket(ticket)
				.assignedBy(findActiveUser(actor.id()))
				.assignedTo(assignee)
				.supportTeam(team)
				.build());
		return ticketMapper.toResponse(ticketRepository.saveAndFlush(ticket));
	}

	@Override
	@Transactional
	public TicketResponse resolveTicket(UserPrincipal actor, UUID ticketId, ResolveTicketRequest request) {
		requireSupportRole(actor);
		Ticket ticket = findAccessibleTicket(actor, ticketId);
		requireOpenForUpdate(ticket);
		TicketStatus currentStatus = ticket.getStatus();
		if (currentStatus == TicketStatus.RESOLVED || currentStatus == TicketStatus.CLOSED) {
			throw new TicketOperationException("Only unresolved tickets can be resolved");
		}
		ticket.setResolutionNotes(request.resolutionNotes().trim());
		ticket.setStatus(TicketStatus.RESOLVED);
		ticket.setResolvedAt(Instant.now());
		recordStatusChange(ticket, currentStatus, TicketStatus.RESOLVED, actor.id(), "Ticket resolved");
		return ticketMapper.toResponse(ticketRepository.saveAndFlush(ticket));
	}

	@Override
	@Transactional
	public TicketCommentResponse addComment(
			UserPrincipal actor, UUID ticketId, AddTicketCommentRequest request) {
		UserRole role = requireTicketParticipantRole(actor);
		Ticket ticket = findAccessibleTicket(actor, ticketId);
		requireOpenForUpdate(ticket);
		CommentVisibility visibility = request.visibility() == null
				? CommentVisibility.PUBLIC
				: request.visibility();
		if (role == UserRole.EMPLOYEE && visibility != CommentVisibility.PUBLIC) {
			throw new TicketOperationException("Employees can only add public comments");
		}
		TicketComment comment = TicketComment.builder()
				.ticket(ticket)
				.user(findActiveUser(actor.id()))
				.comment(request.comment().trim())
				.visibility(visibility)
				.build();
		return ticketMapper.toCommentResponse(commentRepository.save(comment));
	}

	@Override
	@Transactional(readOnly = true)
	public PageResponse<TicketCommentResponse> getComments(
			UserPrincipal actor, UUID ticketId, Pageable pageable) {
		Ticket ticket = findAccessibleTicket(actor, ticketId);
		UserRole role = UserRole.valueOf(actor.role());
		Page<TicketComment> comments = role == UserRole.EMPLOYEE
				? commentRepository.findByTicketIdAndVisibility(ticket.getId(), CommentVisibility.PUBLIC, pageable)
				: commentRepository.findByTicketId(ticket.getId(), pageable);
		return PageResponse.from(comments, ticketMapper::toCommentResponse);
	}

	private PageResponse<TicketResponse> mapTickets(Page<Ticket> tickets) {
		return PageResponse.from(tickets, ticketMapper::toResponse);
	}

	private Ticket findAccessibleTicket(UserPrincipal actor, UUID ticketId) {
		Ticket ticket = ticketRepository.findById(ticketId).orElseThrow(TicketNotFoundException::new);
		ticketAccessService.requireCanAccess(actor, ticket);
		return ticket;
	}

	private User findActiveUser(UUID userId) {
		User user = userRepository.findById(userId).orElseThrow(TicketNotFoundException::new);
		if (!user.isActive()) {
			throw new AccessDeniedException("Inactive users cannot perform ticket operations");
		}
		return user;
	}

	private TicketCategory findActiveCategory(UUID categoryId) {
		TicketCategory category = categoryRepository.findById(categoryId)
				.orElseThrow(TicketNotFoundException::new);
		if (!category.isActive()) {
			throw new TicketOperationException("Inactive categories cannot be assigned to new tickets");
		}
		return category;
	}

	private SupportTeam findActiveTeam(UUID teamId) {
		SupportTeam team = supportTeamRepository.findById(teamId)
				.orElseThrow(TicketNotFoundException::new);
		if (!team.isActive()) {
			throw new TicketOperationException("Inactive support teams cannot receive ticket assignments");
		}
		return team;
	}

	private boolean teamMembershipMatches(UUID teamId, UUID userId) {
		return ticketAccessService.isTeamMember(teamId, userId);
	}

	private void requireOpenForUpdate(Ticket ticket) {
		if (ticket.getStatus() == TicketStatus.CLOSED) {
			throw new TicketOperationException("Closed tickets cannot be updated");
		}
	}

	private boolean isAllowedTransition(TicketStatus current, TicketStatus next, String resolutionNotes) {
		if (current == next) {
			return false;
		}
		return switch (current) {
			case OPEN -> next == TicketStatus.IN_PROGRESS || next == TicketStatus.WAITING_FOR_EMPLOYEE;
			case IN_PROGRESS -> next == TicketStatus.WAITING_FOR_EMPLOYEE;
			case WAITING_FOR_EMPLOYEE -> next == TicketStatus.IN_PROGRESS;
			case RESOLVED -> next == TicketStatus.CLOSED && resolutionNotes != null
					&& !resolutionNotes.isBlank();
			case CLOSED -> false;
		};
	}

	private void recordStatusChange(
			Ticket ticket, TicketStatus fromStatus, TicketStatus toStatus, UUID actorId, String note) {
		statusHistoryRepository.save(TicketStatusHistory.builder()
				.ticket(ticket)
				.changedBy(findActiveUser(actorId))
				.fromStatus(fromStatus)
				.toStatus(toStatus)
				.note(note)
				.build());
	}

	private UserRole requireTicketParticipantRole(UserPrincipal actor) {
		UserRole role = UserRole.valueOf(actor.role());
		if (role != UserRole.EMPLOYEE && role != UserRole.SUPPORT_ENGINEER && role != UserRole.ADMIN) {
			throw new AccessDeniedException("Role cannot access ticket operations");
		}
		return role;
	}

	private void requireSupportRole(UserPrincipal actor) {
		UserRole role = UserRole.valueOf(actor.role());
		if (role != UserRole.SUPPORT_ENGINEER) {
			throw new AccessDeniedException("Support engineer access is required");
		}
	}

	private void requireRole(UserPrincipal actor, UserRole expectedRole) {
		if (actor == null || !expectedRole.name().equals(actor.role())) {
			throw new AccessDeniedException(expectedRole.name() + " access is required");
		}
	}
}
