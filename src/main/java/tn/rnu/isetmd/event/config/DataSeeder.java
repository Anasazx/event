package tn.rnu.isetmd.event.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import tn.rnu.isetmd.event.category.entity.Category;
import tn.rnu.isetmd.event.category.repository.CategoryRepository;
import tn.rnu.isetmd.event.enums.EventStatus;
import tn.rnu.isetmd.event.enums.RegistrationStatus;
import tn.rnu.isetmd.event.enums.RequestStatus;
import tn.rnu.isetmd.event.enums.StaffRole;
import tn.rnu.isetmd.event.enums.UserRole;
import tn.rnu.isetmd.event.event.entity.Event;
import tn.rnu.isetmd.event.event.repository.EventRepository;
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
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.UUID;

/**
 * Inserts demo data on an empty database (disable with SEED_DATA=false).
 * Dates are relative to today so the demo always has upcoming events.
 */
@Slf4j
@Component
@Order(1)
@RequiredArgsConstructor
@ConditionalOnProperty(name = "app.seed.enabled", havingValue = "true")
public class DataSeeder implements ApplicationRunner {

    private final UserRepository userRepository;
    private final CategoryRepository categoryRepository;
    private final VenueRepository venueRepository;
    private final OrganizationRepository organizationRepository;
    private final OrganizationStaffRepository organizationStaffRepository;
    private final EventRepository eventRepository;
    private final TicketTypeRepository ticketTypeRepository;
    private final RegistrationRepository registrationRepository;
    private final ReviewRepository reviewRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (userRepository.count() > 0) {
            return;
        }
        log.info("Empty database, inserting demo data");

        User admin = user("Admin", "EventHub", "admin@eventhub.tn", "Admin@123", UserRole.ADMIN);
        User organizer = user("Amira", "Ben Salah", "organizer@eventhub.tn", "Organizer@123", UserRole.ORGANIZER);
        User checker = user("Youssef", "Trabelsi", "staff@eventhub.tn", "Staff@1234", UserRole.ORGANIZER);
        User musician = user("Karim", "Jaziri", "music@eventhub.tn", "Music@1234", UserRole.ORGANIZER);
        User attendee = user("Sarra", "Mansour", "user@eventhub.tn", "User@1234", UserRole.USER);
        User attendee2 = user("Mehdi", "Gharbi", "mehdi@eventhub.tn", "User@1234", UserRole.USER);

        Category conference = category("Conference", "Talks and keynotes by experts");
        Category workshop = category("Workshop", "Hands-on learning sessions");
        Category hackathon = category("Hackathon", "Build something in a limited time");
        Category music = category("Music", "Concerts and live performances");
        Category sports = category("Sports", "Runs, tournaments and outdoor activities");
        category("Exhibition", "Fairs, expos and showcases");
        category("Training", "Certifications and bootcamps");

        Venue iset = venue("ISET Mahdia - Amphitheatre A", "Route de Hiboun", "Mahdia", 35.5047, 11.0622, 300);
        Venue cityCulture = venue("Cité de la Culture", "Avenue Mohamed V", "Tunis", 36.8065, 10.1815, 1800);
        Venue sousseTheatre = venue("Théâtre de Plein Air", "Boulevard du 14 Janvier", "Sousse", 35.8256, 10.6360, 1200);
        Venue sfaxTech = venue("Technopole de Sfax", "Route de Tunis km 10", "Sfax", 34.7406, 10.7603, 500);
        Venue mahdiaBeach = venue("Corniche de Mahdia", "Corniche", "Mahdia", 35.5040, 11.0710, null);

        Organization techClub = organization("ISET Mahdia Tech Club",
                "Student club organizing workshops, hackathons and talks about software engineering.",
                "contact@techclub-isetmd.tn", "+216 73 000 111", true);
        Organization sahelMusic = organization("Sahel Music Association",
                "Live music nights and festivals across the Sahel region.",
                "hello@sahelmusic.tn", "+216 73 222 333", false);

        staff(techClub, organizer, StaffRole.MODERATOR);
        staff(techClub, checker, StaffRole.CHECK_IN);
        staff(sahelMusic, musician, StaffRole.MODERATOR);

        LocalDate today = LocalDate.now();

        Event springWorkshop = event(techClub, workshop, iset, "Spring Boot & Angular Full-Stack Workshop",
                "Build a complete REST API with Spring Boot 4 and consume it from an Angular 19 single page application. "
                        + "Bring your laptop with Java 21 and Node.js installed.",
                today.plusDays(7).atTime(9, 0), today.plusDays(7).atTime(17, 0), 120, EventStatus.PUBLISHED);
        TicketType workshopFree = ticket(springWorkshop, "Student", "Free for ISET students", "0", 100);
        ticket(springWorkshop, "Professional", "Includes lunch and certificate", "30", 20);

        Event hackathonEvent = event(techClub, hackathon, sfaxTech, "Hackathon Smart City 2026",
                "48 hours to build solutions for smarter Tunisian cities. Teams of 3 to 5, mentors on site, 10 000 TND in prizes.",
                today.plusDays(14).atTime(18, 0), today.plusDays(16).atTime(18, 0), 200, EventStatus.PUBLISHED);
        ticket(hackathonEvent, "Participant", "Team member access, meals included", "15", 180);
        ticket(hackathonEvent, "Mentor", "Reserved for invited mentors", "0", 20);

        Event aiConference = event(techClub, conference, cityCulture, "AI & Data Science Conference",
                "A full day of keynotes on generative AI, MLOps and data engineering with speakers from the industry.",
                today.plusDays(30).atTime(9, 30), today.plusDays(30).atTime(18, 0), 800, EventStatus.PUBLISHED);
        ticket(aiConference, "Early bird", "Limited early bird price", "25", 200);
        ticket(aiConference, "Standard", "General admission", "40", 600);

        Event jazzNight = event(sahelMusic, music, sousseTheatre, "Sunset Jazz Night",
                "An open-air evening of jazz and Tunisian fusion with local and international artists.",
                today.plusDays(21).atTime(20, 0), today.plusDays(21).atTime(23, 30), 1000, EventStatus.PUBLISHED);
        ticket(jazzNight, "General", "Standing area", "35", 900);
        ticket(jazzNight, "VIP", "Seated front rows and welcome drink", "80", 100);

        Event beachRun = event(techClub, sports, mahdiaBeach, "Mahdia Beach Run 5K",
                "A friendly 5 km run along the corniche. All levels welcome, t-shirt for every finisher.",
                today.plusDays(10).atTime(8, 0), today.plusDays(10).atTime(11, 0), 400, EventStatus.PUBLISHED);
        ticket(beachRun, "Runner", "Bib and t-shirt", "0", 400);

        Event pitchDay = event(techClub, conference, iset, "Startup Pitch Day",
                "Students pitch their startup ideas in front of investors and incubators.",
                today.plusDays(45).atTime(14, 0), today.plusDays(45).atTime(18, 0), 150, EventStatus.DRAFT);
        ticket(pitchDay, "Visitor", null, "0", 150);

        Event securityDay = event(techClub, workshop, iset, "Cybersecurity Awareness Day",
                "Capture the flag challenges and talks about securing web applications.",
                today.minusDays(10).atTime(9, 0), today.minusDays(10).atTime(16, 0), 100, EventStatus.COMPLETED);
        TicketType securityTicket = ticket(securityDay, "Attendee", null, "0", 100);

        // Registrations and reviews
        register(attendee, springWorkshop, workshopFree, RegistrationStatus.CONFIRMED);
        register(attendee2, springWorkshop, workshopFree, RegistrationStatus.CONFIRMED);
        register(attendee, securityDay, securityTicket, RegistrationStatus.CHECKED_IN);
        register(attendee2, securityDay, securityTicket, RegistrationStatus.CHECKED_IN);
        review(attendee, securityDay, 5, "Great CTF challenges and very clear talks, thanks to the team!");
        review(attendee2, securityDay, 4, "Very useful, I wish it lasted two days.");

        log.info("Demo data ready. Accounts: {}, {}, {}, {} (see README for passwords)",
                admin.getEmail(), organizer.getEmail(), checker.getEmail(), attendee.getEmail());
    }

    private User user(String firstName, String lastName, String email, String password, UserRole role) {
        User user = new User(firstName, lastName, email, passwordEncoder.encode(password));
        user.setRole(role);
        return userRepository.save(user);
    }

    private Category category(String name, String description) {
        Category category = new Category();
        category.setName(name);
        category.setDescription(description);
        return categoryRepository.save(category);
    }

    private Venue venue(String name, String address, String city, Double latitude, Double longitude, Integer capacity) {
        Venue venue = new Venue();
        venue.setName(name);
        venue.setAddress(address);
        venue.setCity(city);
        venue.setCountry("Tunisia");
        venue.setLatitude(latitude);
        venue.setLongitude(longitude);
        venue.setCapacity(capacity);
        return venueRepository.save(venue);
    }

    private Organization organization(String name, String description, String email, String phone, boolean verified) {
        Organization organization = new Organization();
        organization.setName(name);
        organization.setDescription(description);
        organization.setEmail(email);
        organization.setPhone(phone);
        organization.setVerified(verified);
        return organizationRepository.save(organization);
    }

    private void staff(Organization organization, User user, StaffRole role) {
        organizationStaffRepository.save(new OrganizationStaff(organization, user, role, RequestStatus.APPROVED));
    }

    private Event event(Organization organizer, Category category, Venue venue, String title, String description,
                        LocalDateTime start, LocalDateTime end, int capacity, EventStatus status) {
        Event event = new Event();
        event.setOrganizer(organizer);
        event.setCategory(category);
        event.setVenue(venue);
        event.setTitle(title);
        event.setDescription(description);
        event.setStartDateTime(start);
        event.setEndDateTime(end);
        event.setCapacity(capacity);
        event.setStatus(status);
        return eventRepository.save(event);
    }

    private TicketType ticket(Event event, String name, String description, String price, int quantity) {
        TicketType ticketType = new TicketType();
        ticketType.setEvent(event);
        ticketType.setName(name);
        ticketType.setDescription(description);
        ticketType.setPrice(new BigDecimal(price));
        ticketType.setQuantity(quantity);
        return ticketTypeRepository.save(ticketType);
    }

    private void register(User user, Event event, TicketType ticketType, RegistrationStatus status) {
        Registration registration = new Registration();
        registration.setUser(user);
        registration.setEvent(event);
        registration.setTicketType(ticketType);
        registration.setStatus(status);
        registration.setQrCode("EVT-" + UUID.randomUUID().toString().replace("-", "").toUpperCase());
        registration.setRegisteredAt(event.getStartDateTime().minusDays(3).with(LocalTime.NOON));
        if (status == RegistrationStatus.CHECKED_IN) {
            registration.setCheckedInAt(event.getStartDateTime().plusMinutes(10));
        }
        registrationRepository.save(registration);

        ticketType.setSoldQuantity(ticketType.getSoldQuantity() + 1);
        event.setRegisteredCount(event.getRegisteredCount() + 1);
    }

    private void review(User user, Event event, int rating, String comment) {
        Review review = new Review();
        review.setUser(user);
        review.setEvent(event);
        review.setRating(rating);
        review.setComment(comment);
        reviewRepository.save(review);

        List<Review> reviews = reviewRepository.findByEventIdOrderByCreatedAtDesc(event.getId());
        event.setReviewCount(reviews.size());
        event.setAverageRating(reviews.stream().mapToInt(Review::getRating).average().orElse(0));
    }
}
