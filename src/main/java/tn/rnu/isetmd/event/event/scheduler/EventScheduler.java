package tn.rnu.isetmd.event.event.scheduler;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import tn.rnu.isetmd.event.enums.EventStatus;
import tn.rnu.isetmd.event.enums.NotificationType;
import tn.rnu.isetmd.event.enums.RegistrationStatus;
import tn.rnu.isetmd.event.event.entity.Event;
import tn.rnu.isetmd.event.event.repository.EventRepository;
import tn.rnu.isetmd.event.notification.service.NotificationService;
import tn.rnu.isetmd.event.registration.entity.Registration;
import tn.rnu.isetmd.event.registration.repository.RegistrationRepository;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

/**
 * Background jobs driving the event lifecycle.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class EventScheduler {

    private static final DateTimeFormatter TIME_FORMAT = DateTimeFormatter.ofPattern("dd/MM 'at' HH:mm");

    private final EventRepository eventRepository;
    private final RegistrationRepository registrationRepository;
    private final NotificationService notificationService;

    /**
     * PUBLISHED -> ONGOING when the event starts, PUBLISHED/ONGOING -> COMPLETED when it ends
     */
    @Transactional
    @Scheduled(fixedDelayString = "${app.scheduler.status-interval-ms}", initialDelay = 10_000)
    public void updateEventStatuses() {
        LocalDateTime now = LocalDateTime.now();
        int completed = eventRepository.completeEvents(
                List.of(EventStatus.PUBLISHED, EventStatus.ONGOING), EventStatus.COMPLETED, now);
        int started = eventRepository.startEvents(EventStatus.PUBLISHED, EventStatus.ONGOING, now);
        if (started + completed > 0) {
            log.info("Event statuses updated: {} started, {} completed", started, completed);
        }
    }

    /**
     * Notifies attendees of events starting within the next 24 hours, once per event
     */
    @Transactional
    @Scheduled(fixedDelayString = "${app.scheduler.reminder-interval-ms}", initialDelay = 30_000)
    public void sendReminders() {
        LocalDateTime now = LocalDateTime.now();
        List<Event> events = eventRepository.findEventsNeedingReminder(EventStatus.PUBLISHED, now, now.plusHours(24));

        for (Event event : events) {
            List<Registration> registrations = registrationRepository.findByEventIdAndStatusIn(
                    event.getId(), List.of(RegistrationStatus.PENDING, RegistrationStatus.CONFIRMED));

            notificationService.notifyAll(
                    registrations.stream().map(Registration::getUser).toList(),
                    event,
                    NotificationType.EVENT_REMINDER,
                    "Reminder: " + event.getTitle(),
                    "Starts " + event.getStartDateTime().format(TIME_FORMAT) + " at " + event.getVenue().getName()
                            + ". Don't forget your QR code ticket!"
            );
            event.setReminderSent(true);
        }
        eventRepository.saveAll(events);
    }
}
