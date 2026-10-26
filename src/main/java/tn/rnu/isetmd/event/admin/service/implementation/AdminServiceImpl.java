package tn.rnu.isetmd.event.admin.service.implementation;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tn.rnu.isetmd.event.admin.dto.AdminStatsResponse;
import tn.rnu.isetmd.event.admin.service.AdminService;
import tn.rnu.isetmd.event.enums.EventStatus;
import tn.rnu.isetmd.event.enums.RegistrationStatus;
import tn.rnu.isetmd.event.enums.UserRole;
import tn.rnu.isetmd.event.event.repository.EventRepository;
import tn.rnu.isetmd.event.organizer.repository.OrganizationRepository;
import tn.rnu.isetmd.event.registration.repository.RegistrationRepository;
import tn.rnu.isetmd.event.review.repository.ReviewRepository;
import tn.rnu.isetmd.event.user.repository.UserRepository;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AdminServiceImpl implements AdminService {

    private final UserRepository userRepository;
    private final OrganizationRepository organizationRepository;
    private final EventRepository eventRepository;
    private final RegistrationRepository registrationRepository;
    private final ReviewRepository reviewRepository;

    @Override
    public AdminStatsResponse getStats() {
        Map<String, Long> eventsByStatus = new LinkedHashMap<>();
        for (EventStatus status : EventStatus.values()) {
            eventsByStatus.put(status.name(), eventRepository.countByStatus(status));
        }

        long activeRegistrations = registrationRepository.count()
                - registrationRepository.countByStatus(RegistrationStatus.CANCELLED);

        List<AdminStatsResponse.TopEvent> topEvents = eventRepository
                .findTopByRegistrations(List.of(EventStatus.PUBLISHED, EventStatus.ONGOING, EventStatus.COMPLETED))
                .stream()
                .map(event -> new AdminStatsResponse.TopEvent(
                        event.getId(), event.getTitle(), event.getOrganizer().getName(),
                        event.getRegisteredCount(), event.getCapacity()))
                .toList();

        return new AdminStatsResponse(
                userRepository.count(),
                userRepository.countByRole(UserRole.ORGANIZER),
                organizationRepository.count(),
                eventRepository.count(),
                eventsByStatus,
                activeRegistrations,
                registrationRepository.countByStatus(RegistrationStatus.CHECKED_IN),
                registrationRepository.sumRevenue(List.of(RegistrationStatus.CONFIRMED, RegistrationStatus.CHECKED_IN)),
                reviewRepository.count(),
                topEvents
        );
    }
}
