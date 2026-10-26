package tn.rnu.isetmd.event.integration;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.web.servlet.ResultActions;
import tn.rnu.isetmd.event.event.entity.Event;
import tn.rnu.isetmd.event.event.repository.EventRepository;
import tn.rnu.isetmd.event.support.ApiTestSupport;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.UUID;

import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.not;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Walks through the main business flow: organization -> event -> tickets -> registration -> check-in -> review.
 */
class EventLifecycleIntegrationTest extends ApiTestSupport {

    private static final DateTimeFormatter ISO = DateTimeFormatter.ISO_LOCAL_DATE_TIME;

    @Autowired
    EventRepository eventRepository;

    String organizerToken;
    Long organizationId;
    Long categoryId;
    Long venueId;

    @BeforeEach
    void setUp() throws Exception {
        organizerToken = registerUser();
        ResultActions organization = post("/api/organizations", organizerToken, """
                {"name":"Club %s","description":"Test club"}
                """.formatted(UUID.randomUUID()))
                .andExpect(status().isCreated());
        organizationId = readId(organization, "$.id");
        categoryId = createCategory().getId();
        venueId = createVenue(500).getId();
    }

    @Test
    void creatingAnOrganizationMakesTheCreatorItsModerator() throws Exception {
        get("/api/organizations/me", organizerToken)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.role").value("MODERATOR"))
                .andExpect(jsonPath("$.status").value("APPROVED"));
        get("/api/auth/me", organizerToken).andExpect(jsonPath("$.role").value("ORGANIZER"));

        post("/api/organizations", organizerToken, """
                {"name":"Second org"}
                """).andExpect(status().isConflict());
    }

    @Test
    void onlyOrganizationStaffCanCreateEvents() throws Exception {
        post("/api/events", registerUser(), eventBody(10)).andExpect(status().isForbidden());
        post("/api/events", organizerToken, eventBody(10))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("DRAFT"))
                .andExpect(jsonPath("$.organizerId").value(organizationId));
    }

    @Test
    void draftsAreHiddenUntilPublishedWithATicket() throws Exception {
        Long eventId = createEvent(10);

        get("/api/events/" + eventId, null).andExpect(status().isNotFound());
        get("/api/events/" + eventId, organizerToken).andExpect(status().isOk());
        get("/api/events?size=50", null).andExpect(jsonPath("$.content[*].id", not(hasItem(eventId.intValue()))));

        patch("/api/events/" + eventId + "/publish", organizerToken, null).andExpect(status().isBadRequest());
        createTicket(eventId, "0", 10);
        patch("/api/events/" + eventId + "/publish", organizerToken, null)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("PUBLISHED"));

        get("/api/events/" + eventId, null).andExpect(status().isOk()).andExpect(jsonPath("$.minPrice").value(0));
        get("/api/events?size=50", null).andExpect(jsonPath("$.content[*].id", hasItem(eventId.intValue())));
    }

    @Test
    void registrationRespectsCapacityAndUniqueness() throws Exception {
        Long eventId = createEvent(2);
        Long ticketId = createTicket(eventId, "0", 2);
        patch("/api/events/" + eventId + "/publish", organizerToken, null).andExpect(status().isOk());

        String alice = registerUser();
        String bob = registerUser();
        String carol = registerUser();

        Long aliceRegistration = readId(register(alice, ticketId)
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("CONFIRMED"))
                .andExpect(jsonPath("$.qrCode").isNotEmpty()), "$.id");

        register(alice, ticketId).andExpect(status().isConflict());
        register(bob, ticketId).andExpect(status().isCreated());
        register(carol, ticketId).andExpect(status().isConflict());

        // Cancelling frees a seat
        patch("/api/registrations/" + aliceRegistration + "/cancel", bob, null).andExpect(status().isNotFound());
        patch("/api/registrations/" + aliceRegistration + "/cancel", alice, null)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CANCELLED"));
        register(carol, ticketId).andExpect(status().isCreated());

        Event event = eventRepository.findById(eventId).orElseThrow();
        org.assertj.core.api.Assertions.assertThat(event.getRegisteredCount()).isEqualTo(2);
    }

    @Test
    void paidTicketsArePendingUntilConfirmedAtCheckIn() throws Exception {
        Long eventId = createEvent(10);
        Long ticketId = createTicket(eventId, "25.00", 10);
        patch("/api/events/" + eventId + "/publish", organizerToken, null).andExpect(status().isOk());

        String attendee = registerUser();
        ResultActions registration = register(attendee, ticketId)
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("PENDING"));
        String qrCode = read(registration, "$.qrCode");

        String checkIn = """
                {"eventId":%d,"qrCode":"%s"}
                """.formatted(eventId, qrCode);
        post("/api/registrations/check-in", attendee, checkIn).andExpect(status().isForbidden());
        post("/api/registrations/check-in", organizerToken, checkIn).andExpect(status().isBadRequest());
        post("/api/registrations/check-in", organizerToken, """
                {"eventId":%d,"qrCode":"%s","confirmPayment":true}
                """.formatted(eventId, qrCode))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CHECKED_IN"));
        post("/api/registrations/check-in", organizerToken, checkIn).andExpect(status().isConflict());

        get("/api/events/" + eventId + "/stats", organizerToken)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.checkedIn").value(1))
                .andExpect(jsonPath("$.revenue").value(25.0));
    }

    @Test
    void onlyAttendeesCanReviewAStartedEvent() throws Exception {
        Long eventId = createEvent(10);
        Long ticketId = createTicket(eventId, "0", 10);
        patch("/api/events/" + eventId + "/publish", organizerToken, null).andExpect(status().isOk());

        String attendee = registerUser();
        register(attendee, ticketId).andExpect(status().isCreated());

        String review = """
                {"eventId":%d,"rating":4,"comment":"Nice"}
                """.formatted(eventId);
        post("/api/reviews", attendee, review).andExpect(status().isBadRequest());

        // Move the event into the past
        Event event = eventRepository.findById(eventId).orElseThrow();
        event.setStartDateTime(LocalDateTime.now().minusHours(3));
        event.setEndDateTime(LocalDateTime.now().minusHours(1));
        eventRepository.save(event);

        post("/api/reviews", registerUser(), review).andExpect(status().isForbidden());
        post("/api/reviews", attendee, review).andExpect(status().isCreated());
        post("/api/reviews", attendee, review).andExpect(status().isConflict());

        get("/api/events/" + eventId, null)
                .andExpect(jsonPath("$.averageRating").value(4.0))
                .andExpect(jsonPath("$.reviewCount").value(1));
    }

    @Test
    void cancellingAnEventCancelsRegistrationsAndNotifiesAttendees() throws Exception {
        Long eventId = createEvent(10);
        Long ticketId = createTicket(eventId, "0", 10);
        patch("/api/events/" + eventId + "/publish", organizerToken, null).andExpect(status().isOk());

        String attendee = registerUser();
        register(attendee, ticketId).andExpect(status().isCreated());

        delete("/api/events/" + eventId, organizerToken).andExpect(status().isConflict());
        patch("/api/events/" + eventId + "/cancel", organizerToken, """
                {"reason":"Weather"}
                """).andExpect(status().isOk()).andExpect(jsonPath("$.status").value("CANCELLED"));

        get("/api/registrations/me", attendee).andExpect(jsonPath("$[0].status").value("CANCELLED"));
        get("/api/notifications", attendee).andExpect(jsonPath("$.content[0].type").value("EVENT_CANCELLED"));
    }

    @Test
    void staffJoinRequestIsApprovedByAModerator() throws Exception {
        String candidate = registerUser();
        Long staffId = readId(post("/api/organizations/" + organizationId + "/join", candidate, null)
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("PENDING")), "$.id");

        get("/api/organizations/" + organizationId + "/staff", candidate).andExpect(status().isForbidden());
        patch("/api/organizations/" + organizationId + "/staff/" + staffId + "/approve", candidate, null)
                .andExpect(status().isForbidden());
        patch("/api/organizations/" + organizationId + "/staff/" + staffId + "/approve", organizerToken, """
                {"role":"CHECK_IN"}
                """).andExpect(status().isOk()).andExpect(jsonPath("$.role").value("CHECK_IN"));

        get("/api/organizations/" + organizationId + "/staff", candidate).andExpect(status().isOk());
        // A check-in agent can't create events
        post("/api/events", candidate, eventBody(5)).andExpect(status().isForbidden());
    }

    private Long createEvent(int capacity) throws Exception {
        return readId(post("/api/events", organizerToken, eventBody(capacity)).andExpect(status().isCreated()), "$.id");
    }

    private Long createTicket(Long eventId, String price, int quantity) throws Exception {
        return readId(post("/api/events/" + eventId + "/ticket-types", organizerToken, """
                {"name":"Ticket","price":%s,"quantity":%d}
                """.formatted(price, quantity)).andExpect(status().isCreated()), "$.id");
    }

    private ResultActions register(String token, Long ticketTypeId) throws Exception {
        return post("/api/registrations", token, """
                {"ticketTypeId":%d}
                """.formatted(ticketTypeId));
    }

    private String eventBody(int capacity) {
        LocalDateTime start = LocalDateTime.now().plusDays(5).withNano(0);
        return """
                {"title":"Test event","description":"desc","categoryId":%d,"venueId":%d,
                 "startDateTime":"%s","endDateTime":"%s","capacity":%d}
                """.formatted(categoryId, venueId, start.format(ISO), start.plusHours(3).format(ISO), capacity);
    }
}
