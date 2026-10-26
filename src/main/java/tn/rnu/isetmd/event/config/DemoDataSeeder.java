package tn.rnu.isetmd.event.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import tn.rnu.isetmd.event.category.entity.Category;
import tn.rnu.isetmd.event.category.repository.CategoryRepository;
import tn.rnu.isetmd.event.enums.EventStatus;
import tn.rnu.isetmd.event.enums.NotificationType;
import tn.rnu.isetmd.event.enums.RegistrationStatus;
import tn.rnu.isetmd.event.enums.RequestStatus;
import tn.rnu.isetmd.event.enums.StaffRole;
import tn.rnu.isetmd.event.enums.UserRole;
import tn.rnu.isetmd.event.event.entity.Event;
import tn.rnu.isetmd.event.event.repository.EventRepository;
import tn.rnu.isetmd.event.notification.entity.Notification;
import tn.rnu.isetmd.event.notification.repository.NotificationRepository;
import tn.rnu.isetmd.event.organizer.entity.Organization;
import tn.rnu.isetmd.event.organizer.repository.OrganizationRepository;
import tn.rnu.isetmd.event.organizerStaff.entity.OrganizationStaff;
import tn.rnu.isetmd.event.organizerStaff.repository.OrganizationStaffRepository;
import tn.rnu.isetmd.event.registration.entity.Registration;
import tn.rnu.isetmd.event.registration.repository.RegistrationRepository;
import tn.rnu.isetmd.event.review.entity.Review;
import tn.rnu.isetmd.event.review.repository.ReviewRepository;
import tn.rnu.isetmd.event.ticketType.entity.TicketType;
import tn.rnu.isetmd.event.ticketType.repository.TicketTypeRepository;
import tn.rnu.isetmd.event.user.entity.User;
import tn.rnu.isetmd.event.user.repository.UserRepository;
import tn.rnu.isetmd.event.venue.entity.Venue;
import tn.rnu.isetmd.event.venue.repository.VenueRepository;

import java.math.BigDecimal;
import java.sql.Timestamp;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Random;
import java.util.Set;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * Large experimental dataset for manual testing (profile "demo").
 * <p>
 * Runs after {@link DataSeeder} and adds ~90 users, 8 organizations, ~55 events in every
 * status (past, ongoing, upcoming, drafts, cancelled), registrations, reviews and notifications.
 * A fixed random seed makes the dataset reproducible, dates are relative to today.
 * Every denormalized counter (seats, ticket sales, ratings) matches the generated rows.
 */
@Slf4j
@Component
@Order(2)
@RequiredArgsConstructor
@ConditionalOnProperty(name = "app.seed.demo", havingValue = "true")
public class DemoDataSeeder implements ApplicationRunner {

    /** Present once the demo data has been generated */
    private static final String MARKER_EMAIL = "tunis.devs@demo.tn";
    private static final String ATTENDEE_PASSWORD = "User@1234";
    private static final String ORGANIZER_PASSWORD = "Organizer@123";
    private static final DateTimeFormatter DATE_FORMAT = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");

    private static final String[] FIRST_NAMES = {
            "Ahmed", "Mohamed", "Youssef", "Amine", "Aziz", "Hamza", "Omar", "Bilel", "Skander", "Rayen",
            "Malek", "Wassim", "Khalil", "Firas", "Nour", "Yasmine", "Sarra", "Amira", "Ines", "Mariem",
            "Rania", "Eya", "Salma", "Fatma", "Leila", "Hiba", "Asma", "Chaima", "Oumayma", "Khadija",
            "Ghassen", "Houssem", "Seif", "Aymen", "Dorra", "Emna", "Molka", "Rim", "Taha", "Zied"
    };
    private static final String[] LAST_NAMES = {
            "Ben Ali", "Trabelsi", "Gharbi", "Jaziri", "Mansour", "Haddad", "Ayari", "Bouazizi", "Hammami", "Chaabane",
            "Mejri", "Sassi", "Zouari", "Ferchichi", "Belhaj", "Khelifi", "Dridi", "Riahi", "Masmoudi", "Ben Amor",
            "Karoui", "Jlassi", "Saidi", "Toumi", "Mabrouk"
    };

    private static final String[] GOOD_COMMENTS = {
            "Amazing organization, I learned a lot!",
            "Great speakers and a very friendly atmosphere.",
            "Totally worth it, see you at the next edition.",
            "Well organized, check-in took less than a minute with the QR code.",
            "The venue was perfect and the content really practical.",
            "One of the best events I attended this year.",
            "Loved it! The networking part was really useful.",
            "Very professional team, everything was on time."
    };
    private static final String[] AVERAGE_COMMENTS = {
            "Good event overall but it started late.",
            "Interesting content, the room was a bit too small.",
            "Nice experience, sound quality could be improved.",
            "Decent, but I expected more hands-on activities.",
            "Fine, although the queue at the entrance was long."
    };
    private static final String[] BAD_COMMENTS = {
            "Disappointing, the program changed at the last minute.",
            "Too crowded and badly organized."
    };

    private final UserRepository userRepository;
    private final CategoryRepository categoryRepository;
    private final VenueRepository venueRepository;
    private final OrganizationRepository organizationRepository;
    private final OrganizationStaffRepository organizationStaffRepository;
    private final EventRepository eventRepository;
    private final TicketTypeRepository ticketTypeRepository;
    private final RegistrationRepository registrationRepository;
    private final ReviewRepository reviewRepository;
    private final NotificationRepository notificationRepository;
    private final PasswordEncoder passwordEncoder;
    private final JdbcTemplate jdbcTemplate;

    private final Random random = new Random(2026);
    private final LocalDateTime now = LocalDateTime.now().withSecond(0).withNano(0);

    private Map<String, Category> categories;
    private final List<Notification> notifications = new ArrayList<>();
    /** Dates applied after insert, @CreationTimestamp always writes "now" */
    private final List<LocalDateTime> notificationDates = new ArrayList<>();
    private final List<Review> reviews = new ArrayList<>();
    private final List<LocalDateTime> reviewDates = new ArrayList<>();

    /** One template per event idea: category, title, description, ticket offers */
    private record EventTemplate(String category, String title, String description, int durationHours, List<Offer> offers) {}

    private record Offer(String name, String description, String price, double share) {}

    private record OrganizationPlan(String name, String email, String moderatorFirst, String moderatorLast,
                                    String description, boolean verified, List<String> cities, List<EventTemplate> events) {}

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (userRepository.existsByEmailIgnoreCase(MARKER_EMAIL)) {
            log.info("Demo dataset already present");
            return;
        }
        long start = System.currentTimeMillis();
        log.info("Generating the demo dataset...");

        categories = loadCategories();
        Map<String, List<Venue>> venuesByCity = createVenues();

        // Attendees: the generated people plus the base demo accounts
        List<User> attendees = new ArrayList<>(createAttendees(80));
        userRepository.findByEmailIgnoreCase("user@eventhub.tn").ifPresent(attendees::add);
        userRepository.findByEmailIgnoreCase("mehdi@eventhub.tn").ifPresent(attendees::add);
        Collections.shuffle(attendees, random);

        // A few attendees become staff of the new organizations, the others stay attendees
        List<User> staffPool = new ArrayList<>(attendees.subList(0, 16));
        List<User> joinRequestPool = new ArrayList<>(attendees.subList(16, 20));

        int eventCount = 0;
        int organizationIndex = 0;
        List<Organization> organizations = new ArrayList<>();
        for (OrganizationPlan plan : organizationPlans()) {
            Organization organization = createOrganization(plan);
            organizations.add(organization);

            User moderator = createUser(plan.moderatorFirst(), plan.moderatorLast(), plan.email(), ORGANIZER_PASSWORD, UserRole.ORGANIZER);
            membership(organization, moderator, StaffRole.MODERATOR, RequestStatus.APPROVED);
            for (int i = 0; i < 2 && !staffPool.isEmpty(); i++) {
                User member = staffPool.removeFirst();
                member.setRole(UserRole.ORGANIZER);
                membership(organization, member, i == 0 ? StaffRole.ORGANIZER : StaffRole.CHECK_IN, RequestStatus.APPROVED);
            }

            // Spread the events of the organization over the timeline (past -> future)
            List<EventTemplate> templates = plan.events();
            for (int i = 0; i < templates.size(); i++) {
                double position = templates.size() == 1 ? 0.5 : (double) i / (templates.size() - 1);
                int dayOffset = (int) Math.round(-75 + position * 165) + random.nextInt(9) - 4;
                String city = plan.cities().get(i % plan.cities().size());
                Venue venue = pick(venuesByCity.get(city));
                createEventWithActivity(organization, templates.get(i), venue, dayOffset, attendees, organizationIndex * 31 + i);
                eventCount++;
            }
            organizationIndex++;
        }

        // An event happening right now, to test the ONGOING status and check-in
        createOngoingEvent(organizations.getFirst(), pick(venuesByCity.get("Tunis")), attendees);
        eventCount++;

        // Pending join requests for the moderators to review
        for (int i = 0; i < joinRequestPool.size(); i++) {
            membership(organizations.get(i % organizations.size()), joinRequestPool.get(i), StaffRole.VOLUNTEER, RequestStatus.PENDING);
        }

        // Two disabled accounts for the admin pages
        createUser("Spam", "Account", "spam.account@demo.tn", ATTENDEE_PASSWORD, UserRole.USER).setEnabled(false);
        createUser("Old", "Member", "old.member@demo.tn", ATTENDEE_PASSWORD, UserRole.USER).setEnabled(false);

        notificationRepository.saveAll(notifications);
        backdate();

        log.info("Demo dataset ready in {} ms: {} users, {} organizations, {} events, {} registrations, {} reviews, {} notifications",
                System.currentTimeMillis() - start, userRepository.count(), organizationRepository.count(),
                eventRepository.count(), registrationRepository.count(), reviewRepository.count(), notificationRepository.count());
        log.info("Demo logins: any *@demo.tn attendee / {}, organization moderators (e.g. {}) / {}",
                ATTENDEE_PASSWORD, MARKER_EMAIL, ORGANIZER_PASSWORD);
    }

    // ------------------------------------------------------------------ events

    private void createEventWithActivity(Organization organization, EventTemplate template, Venue venue,
                                         int dayOffset, List<User> attendees, int imageSeed) {
        int[] startHours = {9, 10, 14, 18, 19, 20};
        LocalDateTime start = LocalDate.now().plusDays(dayOffset).atTime(startHours[random.nextInt(startHours.length)], 0);
        LocalDateTime end = start.plusHours(template.durationHours());

        int capacity = Math.min(venue.getCapacity() != null ? venue.getCapacity() : 2000, 40 + random.nextInt(8) * 30);

        EventStatus status;
        int roll = random.nextInt(100);
        if (!end.isAfter(now)) {
            status = roll < 8 ? EventStatus.CANCELLED : EventStatus.COMPLETED;
        } else if (!start.isAfter(now)) {
            status = EventStatus.ONGOING;
        } else if (dayOffset > 45 && roll < 35) {
            status = EventStatus.DRAFT;
        } else {
            status = roll < 5 ? EventStatus.CANCELLED : EventStatus.PUBLISHED;
        }

        // Some small upcoming events are completely sold out, to test the "Sold out" states
        boolean sellOut = status == EventStatus.PUBLISHED && random.nextInt(100) < 18;
        if (sellOut) {
            capacity = 30 + random.nextInt(25);
        }

        Event event = saveEvent(organization, template, venue, start, end, capacity, status, imageSeed);
        List<TicketType> tickets = createTickets(event, template.offers(), capacity);

        if (status != EventStatus.DRAFT) {
            createRegistrations(event, tickets, attendees, sellOut);
        }
    }

    private void createOngoingEvent(Organization organization, Venue venue, List<User> attendees) {
        EventTemplate template = new EventTemplate("Conference", "Live: Cloud & DevOps Day",
                "Happening right now! Talks on Kubernetes, CI/CD pipelines and observability, followed by a hands-on lab.",
                6, List.of(new Offer("Free pass", "Access to all talks", "0", 0.7), new Offer("Lab seat", "Talks + hands-on lab", "20", 0.3)));
        LocalDateTime start = now.minusHours(2);
        Event event = saveEvent(organization, template, venue, start, start.plusHours(6),
                Math.min(venue.getCapacity() != null ? venue.getCapacity() : 300, 150), EventStatus.ONGOING, 999);
        createRegistrations(event, createTickets(event, template.offers(), event.getCapacity()), attendees, false);
    }

    private Event saveEvent(Organization organization, EventTemplate template, Venue venue, LocalDateTime start,
                            LocalDateTime end, int capacity, EventStatus status, int imageSeed) {
        Event event = new Event();
        event.setOrganizer(organization);
        event.setCategory(categories.get(template.category()));
        event.setVenue(venue);
        event.setTitle(template.title());
        event.setDescription(template.description());
        // Placeholder photos (needs internet), the UI falls back to a gradient otherwise
        event.setCoverImage(random.nextInt(100) < 85 ? "https://picsum.photos/seed/eventhub-" + imageSeed + "/1200/600" : null);
        event.setStartDateTime(start);
        event.setEndDateTime(end);
        event.setCapacity(capacity);
        event.setStatus(status);
        event.setReminderSent(start.isBefore(now.plusHours(24)));
        return eventRepository.save(event);
    }

    private List<TicketType> createTickets(Event event, List<Offer> offers, int capacity) {
        List<TicketType> tickets = new ArrayList<>();
        for (Offer offer : offers) {
            TicketType ticket = new TicketType();
            ticket.setEvent(event);
            ticket.setName(offer.name());
            ticket.setDescription(offer.description());
            ticket.setPrice(new BigDecimal(offer.price()));
            ticket.setQuantity(Math.max(5, (int) Math.round(capacity * offer.share())));
            // Early bird style tickets stop selling two weeks before the event
            if (offer.name().toLowerCase().contains("early")) {
                ticket.setSaleEnd(event.getStartDateTime().minusDays(14));
            }
            tickets.add(ticketTypeRepository.save(ticket));
        }
        return tickets;
    }

    /**
     * Registers a share of the attendees, with statuses consistent with the event timeline,
     * then writes reviews and notifications.
     */
    private void createRegistrations(Event event, List<TicketType> tickets, List<User> attendees, boolean sellOut) {
        double fill = switch (event.getStatus()) {
            case COMPLETED -> 0.55 + random.nextDouble() * 0.4;
            case ONGOING -> 0.6 + random.nextDouble() * 0.3;
            case CANCELLED -> 0.2 + random.nextDouble() * 0.3;
            default -> 0.05 + random.nextDouble() * 0.85;
        };
        int wanted = Math.min((int) Math.round(event.getCapacity() * fill), attendees.size());

        List<User> pool = new ArrayList<>(attendees);
        Collections.shuffle(pool, random);

        if (sellOut) {
            wanted = Math.min(event.getCapacity(), pool.size());
        }

        List<Registration> registrations = new ArrayList<>();
        for (User user : pool) {
            if (registrations.size() >= wanted) break;
            TicketType ticket = pickTicketWithStock(tickets);
            if (ticket == null || event.getRegisteredCount() >= event.getCapacity()) break;

            Registration registration = new Registration();
            registration.setUser(user);
            registration.setEvent(event);
            registration.setTicketType(ticket);
            registration.setQrCode("EVT-" + UUID.randomUUID().toString().replace("-", "").toUpperCase());
            registration.setRegisteredAt(randomBefore(event.getStartDateTime()));
            registration.setStatus(registrationStatus(event, ticket));
            if (sellOut && registration.getStatus() == RegistrationStatus.CANCELLED) {
                registration.setStatus(RegistrationStatus.CONFIRMED);
            }

            switch (registration.getStatus()) {
                case CHECKED_IN -> registration.setCheckedInAt(event.getStartDateTime().plusMinutes(random.nextInt(50)));
                case CANCELLED -> registration.setCancelledAt(event.getStatus() == EventStatus.CANCELLED
                        ? event.getStartDateTime().minusDays(2)
                        : registration.getRegisteredAt().plusDays(1));
                default -> { }
            }

            // Like the application: cancelling a registration releases the seat, cancelling an event doesn't
            boolean holdsSeat = registration.getStatus() != RegistrationStatus.CANCELLED || event.getStatus() == EventStatus.CANCELLED;
            if (holdsSeat) {
                ticket.setSoldQuantity(ticket.getSoldQuantity() + 1);
                event.setRegisteredCount(event.getRegisteredCount() + 1);
            }
            registrations.add(registration);
            notifyAbout(registration);
        }
        registrationRepository.saveAll(registrations);

        if (event.getStatus() == EventStatus.COMPLETED || event.getStatus() == EventStatus.ONGOING) {
            createReviews(event, registrations);
        }
    }

    private RegistrationStatus registrationStatus(Event event, TicketType ticket) {
        boolean free = ticket.getPrice().signum() == 0;
        int roll = random.nextInt(100);
        return switch (event.getStatus()) {
            case CANCELLED -> RegistrationStatus.CANCELLED;
            case COMPLETED -> roll < 78 ? RegistrationStatus.CHECKED_IN : roll < 94 ? RegistrationStatus.CONFIRMED : RegistrationStatus.CANCELLED;
            case ONGOING -> roll < 55 ? RegistrationStatus.CHECKED_IN : roll < 85 || free ? RegistrationStatus.CONFIRMED : RegistrationStatus.PENDING;
            default -> roll < 7 ? RegistrationStatus.CANCELLED
                    : free || roll < 65 ? RegistrationStatus.CONFIRMED : RegistrationStatus.PENDING;
        };
    }

    private void createReviews(Event event, List<Registration> registrations) {
        List<Review> eventReviews = new ArrayList<>();
        for (Registration registration : registrations) {
            if (registration.getStatus() != RegistrationStatus.CHECKED_IN || random.nextInt(100) >= 55) continue;

            int roll = random.nextInt(100);
            int rating = roll < 45 ? 5 : roll < 78 ? 4 : roll < 92 ? 3 : roll < 97 ? 2 : 1;
            Review review = new Review();
            review.setUser(registration.getUser());
            review.setEvent(event);
            review.setRating(rating);
            if (random.nextInt(100) < 80) {
                review.setComment(rating >= 4 ? pick(GOOD_COMMENTS) : rating == 3 ? pick(AVERAGE_COMMENTS) : pick(BAD_COMMENTS));
            }
            eventReviews.add(review);
            LocalDateTime reviewedAt = event.getEndDateTime().plusHours(1 + random.nextInt(72));
            reviewDates.add(reviewedAt.isAfter(now) ? now.minusMinutes(random.nextInt(90)) : reviewedAt);
        }
        reviews.addAll(reviewRepository.saveAll(eventReviews));

        event.setReviewCount(eventReviews.size());
        event.setAverageRating(eventReviews.stream().mapToInt(Review::getRating).average().orElse(0));
    }

    private void notifyAbout(Registration registration) {
        Event event = registration.getEvent();
        boolean past = event.getEndDateTime().isBefore(now);

        add(notification(registration.getUser(), event, NotificationType.REGISTRATION,
                registration.getTicketType().getPrice().signum() == 0 ? "Registration confirmed" : "Registration received",
                "Your " + registration.getTicketType().getName() + " ticket for \"" + event.getTitle() + "\" on "
                        + event.getStartDateTime().format(DATE_FORMAT) + " is ready.", past || random.nextBoolean()),
                registration.getRegisteredAt());

        if (event.getStatus() == EventStatus.CANCELLED) {
            add(notification(registration.getUser(), event, NotificationType.EVENT_CANCELLED, "Event cancelled",
                    "\"" + event.getTitle() + "\" has been cancelled by the organizer.", random.nextBoolean()),
                    min(event.getStartDateTime().minusDays(2), now.minusHours(1)));
        } else if (registration.getStatus() == RegistrationStatus.CHECKED_IN) {
            add(notification(registration.getUser(), event, NotificationType.CHECK_IN,
                    "Welcome to " + event.getTitle(), "You have been checked in. Enjoy the event!", true),
                    registration.getCheckedInAt());
        } else if (event.isReminderSent() && !past && registration.getStatus() != RegistrationStatus.CANCELLED) {
            add(notification(registration.getUser(), event, NotificationType.EVENT_REMINDER,
                    "Reminder: " + event.getTitle(), "Starts soon at " + event.getVenue().getName() + ". Don't forget your QR code!", false),
                    min(event.getStartDateTime().minusHours(23), now.minusMinutes(5)));
        }
    }

    private void add(Notification notification, LocalDateTime date) {
        notifications.add(notification);
        notificationDates.add(date);
    }

    private LocalDateTime min(LocalDateTime a, LocalDateTime b) {
        return a.isBefore(b) ? a : b;
    }

    /**
     * Rewrites the creation dates so reviews come after their event and notifications
     * appear when they would have been sent (the lists keep insertion order).
     */
    private void backdate() {
        reviewRepository.flush();
        notificationRepository.flush();
        List<Object[]> reviewRows = new ArrayList<>();
        for (int i = 0; i < reviews.size(); i++) {
            Timestamp date = Timestamp.valueOf(reviewDates.get(i));
            reviewRows.add(new Object[]{date, date, reviews.get(i).getId()});
        }
        jdbcTemplate.batchUpdate("update reviews set created_at = ?, updated_at = ? where id = ?", reviewRows);

        List<Object[]> notificationRows = new ArrayList<>();
        for (int i = 0; i < notifications.size(); i++) {
            notificationRows.add(new Object[]{Timestamp.valueOf(notificationDates.get(i)), notifications.get(i).getId()});
        }
        jdbcTemplate.batchUpdate("update notifications set created_at = ? where id = ?", notificationRows);
    }

    private Notification notification(User user, Event event, NotificationType type, String title, String message, boolean read) {
        Notification notification = new Notification();
        notification.setUser(user);
        notification.setEvent(event);
        notification.setType(type);
        notification.setTitle(title);
        notification.setMessage(message);
        notification.setRead(read);
        return notification;
    }

    // ------------------------------------------------------------------ people and places

    private List<User> createAttendees(int count) {
        Set<String> emails = new HashSet<>();
        List<User> users = new ArrayList<>();
        String hash = passwordEncoder.encode(ATTENDEE_PASSWORD);
        while (users.size() < count) {
            String first = pick(FIRST_NAMES);
            String last = pick(LAST_NAMES);
            String email = (first + "." + last).toLowerCase().replace(" ", "") + "@demo.tn";
            if (!emails.add(email)) {
                email = (first + "." + last).toLowerCase().replace(" ", "") + emails.size() + "@demo.tn";
                emails.add(email);
            }
            User user = new User(first, last, email, hash);
            users.add(user);
        }
        return userRepository.saveAll(users);
    }

    private User createUser(String first, String last, String email, String password, UserRole role) {
        User user = new User(first, last, email, passwordEncoder.encode(password));
        user.setRole(role);
        return userRepository.save(user);
    }

    private void membership(Organization organization, User user, StaffRole role, RequestStatus status) {
        organizationStaffRepository.save(new OrganizationStaff(organization, user, role, status));
    }

    private Organization createOrganization(OrganizationPlan plan) {
        Organization organization = new Organization();
        organization.setName(plan.name());
        organization.setDescription(plan.description());
        organization.setEmail(plan.email());
        organization.setPhone("+216 " + (20 + random.nextInt(79)) + " " + (100 + random.nextInt(899)) + " " + (100 + random.nextInt(899)));
        organization.setWebsite("https://" + plan.name().toLowerCase().replaceAll("[^a-z]+", "") + ".tn");
        organization.setAddress(plan.cities().getFirst() + ", Tunisia");
        organization.setVerified(plan.verified());
        return organizationRepository.save(organization);
    }

    private Map<String, Category> loadCategories() {
        for (String name : List.of("Conference", "Workshop", "Hackathon", "Music", "Sports", "Exhibition", "Training", "Festival", "Theatre")) {
            if (!categoryRepository.existsByNameIgnoreCase(name)) {
                Category category = new Category();
                category.setName(name);
                category.setDescription(name + " events");
                categoryRepository.save(category);
            }
        }
        return categoryRepository.findAll().stream().collect(Collectors.toMap(Category::getName, Function.identity()));
    }

    private Map<String, List<Venue>> createVenues() {
        Object[][] venues = {
                {"Palais des Congrès", "Avenue Mohamed V", "Tunis", 36.8008, 10.1815, 2500},
                {"Technopark El Ghazala", "Pôle Technologique El Ghazala", "Tunis", 36.8946, 10.1867, 400},
                {"Cinéma Le Colisée", "Avenue Habib Bourguiba", "Tunis", 36.7998, 10.1815, 600},
                {"Novotel Tunis - Salle Carthage", "Avenue Mohamed V", "Tunis", 36.8125, 10.1802, 350},
                {"Stade Olympique de Sousse", "Boulevard du 7 Novembre", "Sousse", 35.8167, 10.6000, 5000},
                {"Sousse Business Center", "Avenue Taïeb Mhiri", "Sousse", 35.8288, 10.6405, 300},
                {"Faculté des Sciences de Sfax", "Route de la Soukra km 4", "Sfax", 34.7398, 10.7531, 450},
                {"Sfax Innovation Hub", "Avenue Majida Boulila", "Sfax", 34.7445, 10.7600, 180},
                {"Monastir Marina Hall", "Port de plaisance", "Monastir", 35.7780, 10.8262, 500},
                {"ENIM Amphitheatre", "Avenue Ibn El Jazzar", "Monastir", 35.7643, 10.8113, 250},
                {"Djerba Explore Park", "Midoun", "Djerba", 33.8076, 10.9947, 3000},
                {"Houmt Souk Cultural Center", "Houmt Souk", "Djerba", 33.8750, 10.8575, 400},
                {"Centre Culturel de Hammamet", "Avenue des Nations Unies", "Hammamet", 36.4000, 10.6167, 1000},
                {"Bizerte Old Port", "Vieux Port", "Bizerte", 37.2744, 9.8739, 800},
                {"Kairouan Medina Hall", "Bab Ech Chouhada", "Kairouan", 35.6781, 10.0963, 300}
        };
        for (Object[] row : venues) {
            Venue venue = new Venue();
            venue.setName((String) row[0]);
            venue.setAddress((String) row[1]);
            venue.setCity((String) row[2]);
            venue.setCountry("Tunisia");
            venue.setLatitude((Double) row[3]);
            venue.setLongitude((Double) row[4]);
            venue.setCapacity((Integer) row[5]);
            venueRepository.save(venue);
        }
        return venueRepository.findAll().stream().collect(Collectors.groupingBy(Venue::getCity));
    }

    // ------------------------------------------------------------------ catalogue content

    private List<OrganizationPlan> organizationPlans() {
        return List.of(
                new OrganizationPlan("Tunis Developers Community", MARKER_EMAIL, "Wael", "Bouzid",
                        "The largest community of software developers in Tunis: monthly meetups, workshops and an annual conference.",
                        true, List.of("Tunis"), List.of(
                        tech("Conference", "DevFest Tunis", "A full day of talks about web, mobile, cloud and AI by Google Developer Experts and local speakers.", 9),
                        tech("Workshop", "Docker & Kubernetes Hands-on", "From your first container to a deployment on a Kubernetes cluster. Laptop required.", 4),
                        tech("Workshop", "React vs Angular: Build the Same App", "Two trainers build the same application live with React and Angular, then compare.", 3),
                        tech("Hackathon", "Fintech Hackathon Tunis", "36 hours to build the future of payments in Tunisia. Teams of 3 to 5, mentors from local banks.", 36),
                        tech("Conference", "Women in Tech Tunisia", "Inspiring talks and panels with women leading tech teams in Tunisia and abroad.", 6),
                        tech("Training", "Spring Security in Depth", "JWT, OAuth2 and method security explained with live coding.", 5),
                        tech("Conference", "Open Source Day", "Contribute to open source projects with maintainers, talks in the morning, sprints in the afternoon.", 7),
                        tech("Workshop", "Git Like a Pro", "Rebase, bisect, worktrees and a clean history: level up your Git skills.", 3))),
                new OrganizationPlan("Sousse Sports Club", "sousse.sports@demo.tn", "Karim", "Sfaxi",
                        "Running, cycling and beach sports events along the Sousse coast for all levels.",
                        true, List.of("Sousse", "Monastir"), List.of(
                        sport("Sousse Half Marathon", "21 km along the corniche, timing chip, medal and t-shirt for every finisher.", 5),
                        sport("Beach Volley Tournament", "4x4 tournament on the beach, register your team or join one on site.", 8),
                        sport("Sunrise Yoga on the Beach", "Relaxing yoga session at sunrise, mats provided.", 2),
                        sport("Coastal Cycling Tour 60K", "Group ride from Sousse to Monastir and back, support vehicle included.", 4),
                        sport("Kids Football Cup", "Football tournament for children aged 8 to 14.", 6),
                        sport("Trail Night Run", "10 km night trail with head lamps through the olive groves.", 3))),
                new OrganizationPlan("Carthage Culture Association", "carthage.culture@demo.tn", "Lina", "Ghannouchi",
                        "Concerts, exhibitions and cultural nights celebrating Tunisian and Mediterranean heritage.",
                        true, List.of("Tunis", "Hammamet"), List.of(
                        music("Malouf Night", "An evening of traditional Tunisian Malouf music with the national orchestra.", 3),
                        music("Jazz under the Stars", "Open-air jazz concert with Tunisian and European artists.", 4),
                        culture("Exhibition", "Contemporary Tunisian Painters", "A curated exhibition of 40 artworks by emerging Tunisian painters.", 8),
                        music("Electro Sunset Festival", "Electronic music festival by the sea with international DJs.", 8),
                        culture("Theatre", "El Hadhra Revisited", "A modern staging of the famous Sufi musical show.", 3),
                        culture("Exhibition", "Photography: Faces of the Medina", "Black and white portraits of the inhabitants of the Medina of Tunis.", 8),
                        music("Rap Tounsi Live", "The new wave of Tunisian rap on one stage.", 4))),
                new OrganizationPlan("Sfax Startup Hub", "sfax.startups@demo.tn", "Mourad", "Kammoun",
                        "Incubator and community supporting startups in the south of Tunisia.",
                        false, List.of("Sfax"), List.of(
                        tech("Conference", "Startup Act: Funding Your Startup", "Everything about the Startup Act label, grants and seed funding in Tunisia.", 4),
                        tech("Training", "Lean Startup Bootcamp", "Three intensive days to validate your idea with real customers.", 8),
                        tech("Conference", "Pitch Night Sfax", "Ten startups pitch in front of investors, the audience votes for its favourite.", 3),
                        tech("Workshop", "Digital Marketing for Startups", "SEO, social ads and growth hacking on a small budget.", 4),
                        tech("Training", "Product Management 101", "Roadmaps, user stories and prioritisation for first-time product managers.", 6))),
                new OrganizationPlan("Monastir Robotics Club", "monastir.robotics@demo.tn", "Seifeddine", "Hadj Taieb",
                        "Engineering students building robots, drones and IoT projects.",
                        false, List.of("Monastir"), List.of(
                        tech("Hackathon", "RoboCup Monastir", "Line follower and sumo robot competitions for students and high schools.", 10),
                        tech("Workshop", "Arduino for Beginners", "Build your first circuit and program an Arduino in one afternoon.", 4),
                        tech("Workshop", "Drone Assembly Workshop", "Assemble and fly a small quadcopter. Kits provided.", 5),
                        tech("Hackathon", "IoT Smart Farming Challenge", "Build connected solutions for Tunisian farmers in 24 hours.", 24),
                        tech("Training", "ROS 2 Crash Course", "Introduction to the Robot Operating System with simulations.", 6))),
                new OrganizationPlan("Djerba Festival Committee", "djerba.festival@demo.tn", "Hedi", "Ben Youssef",
                        "Organizer of festivals and cultural events on the island of Djerba.",
                        true, List.of("Djerba"), List.of(
                        music("Djerba Music Festival", "Three stages, world music, and the best of Tunisian artists by the sea.", 10),
                        culture("Festival", "Ulysses Festival", "Storytelling, street theatre and parades inspired by the Odyssey.", 8),
                        culture("Exhibition", "Djerbahood Street Art Tour", "Guided tour of the open-air street art museum of Erriadh.", 3),
                        music("Sunset Oud Session", "Intimate oud concert at sunset on the beach.", 2),
                        culture("Festival", "Pottery Days of Guellala", "Live pottery demonstrations and workshops with local artisans.", 6))),
                new OrganizationPlan("Bizerte Sailing Association", "bizerte.sailing@demo.tn", "Nizar", "Ben Romdhane",
                        "Sailing races, sea discovery days and environmental clean-ups in Bizerte.",
                        false, List.of("Bizerte"), List.of(
                        sport("Bizerte Regatta", "The traditional regatta of the old port, open to all sailing clubs.", 6),
                        sport("Kayak Discovery Day", "Discover the lake of Bizerte by kayak, guides and equipment included.", 4),
                        culture("Festival", "Beach Clean-up & Concert", "Clean the beach in the morning, enjoy a free concert in the afternoon.", 6))),
                new OrganizationPlan("Kairouan Heritage Foundation", "kairouan.heritage@demo.tn", "Sonia", "Chebbi",
                        "Preserving and promoting the heritage of Kairouan through visits, talks and exhibitions.",
                        true, List.of("Kairouan"), List.of(
                        culture("Exhibition", "Carpets of Kairouan", "History and craftsmanship of the famous Kairouan carpets.", 8),
                        culture("Conference", "Kairouan, City of Science", "Talks about the scholars of Kairouan in the Middle Ages.", 3),
                        culture("Festival", "Mawlid Nights", "Traditional celebrations, chants and sweets in the medina.", 5)))
        );
    }

    private EventTemplate tech(String category, String title, String description, int hours) {
        int style = random.nextInt(4);
        List<Offer> offers = switch (style) {
            case 0 -> List.of(new Offer("Free", "General admission", "0", 1.0));
            case 1 -> List.of(new Offer("Student", "Student card required at the entrance", "0", 0.6),
                    new Offer("Professional", "Includes lunch and certificate", pickPrice(20, 40, 60), 0.4));
            case 2 -> List.of(new Offer("Early bird", "Limited early bird price", pickPrice(15, 25), 0.3),
                    new Offer("Standard", "General admission", pickPrice(35, 50), 0.6),
                    new Offer("VIP", "Front rows, lunch with the speakers", pickPrice(90, 120), 0.1));
            default -> List.of(new Offer("Participant", "Full access", pickPrice(10, 15, 30), 1.0));
        };
        return new EventTemplate(category, title, description, hours, offers);
    }

    private EventTemplate sport(String title, String description, int hours) {
        List<Offer> offers = random.nextBoolean()
                ? List.of(new Offer("Runner", "Bib, t-shirt and refreshments", pickPrice(15, 25, 35), 1.0))
                : List.of(new Offer("Participant", "Open to everyone", "0", 0.8), new Offer("Pack", "Participation + equipment kit", pickPrice(20, 30), 0.2));
        return new EventTemplate("Sports", title, description, hours, offers);
    }

    private EventTemplate music(String title, String description, int hours) {
        return new EventTemplate("Music", title, description, hours, List.of(
                new Offer("General", "Standing area", pickPrice(20, 30, 40), 0.85),
                new Offer("VIP", "Seated area and welcome drink", pickPrice(70, 90, 120), 0.15)));
    }

    private EventTemplate culture(String category, String title, String description, int hours) {
        List<Offer> offers = random.nextInt(3) == 0
                ? List.of(new Offer("Visitor", "Free entrance", "0", 1.0))
                : List.of(new Offer("Adult", null, pickPrice(10, 15, 20), 0.7), new Offer("Reduced", "Students and children", pickPrice(5, 8), 0.3));
        return new EventTemplate(category, title, description, hours, offers);
    }

    // ------------------------------------------------------------------ helpers

    private TicketType pickTicketWithStock(List<TicketType> tickets) {
        List<TicketType> available = tickets.stream().filter(ticket -> ticket.getAvailable() > 0).toList();
        if (available.isEmpty()) return null;
        // Weighted by remaining stock so cheap tickets sell more
        int total = available.stream().mapToInt(TicketType::getAvailable).sum();
        int roll = random.nextInt(total);
        for (TicketType ticket : available) {
            roll -= ticket.getAvailable();
            if (roll < 0) return ticket;
        }
        return available.getLast();
    }

    private LocalDateTime randomBefore(LocalDateTime eventStart) {
        LocalDateTime limit = eventStart.isBefore(now) ? eventStart : now;
        return limit.minusHours(2 + random.nextInt(24 * 30));
    }

    private String pickPrice(int... prices) {
        return String.valueOf(prices[random.nextInt(prices.length)]);
    }

    private <T> T pick(T[] values) {
        return values[random.nextInt(values.length)];
    }

    private <T> T pick(List<T> values) {
        return values.get(random.nextInt(values.size()));
    }
}
