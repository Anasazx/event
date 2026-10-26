package tn.rnu.isetmd.event.registration.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import tn.rnu.isetmd.event.config.SecurityUtils;
import tn.rnu.isetmd.event.enums.RegistrationStatus;
import tn.rnu.isetmd.event.registration.dto.CheckInRequest;
import tn.rnu.isetmd.event.registration.dto.CreateRegistrationRequest;
import tn.rnu.isetmd.event.registration.dto.RegistrationResponse;
import tn.rnu.isetmd.event.registration.service.RegistrationService;

import java.util.List;

@RestController
@RequestMapping("/api/registrations")
@RequiredArgsConstructor
public class RegistrationController {

    private final RegistrationService registrationService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    RegistrationResponse register(@Valid @RequestBody CreateRegistrationRequest request) {
        return registrationService.register(SecurityUtils.getCurrentUserId(), request.ticketTypeId());
    }

    @GetMapping("/me")
    List<RegistrationResponse> getMyRegistrations() {
        return registrationService.getMyRegistrations(SecurityUtils.getCurrentUserId());
    }

    /**
     * 204 when the current user is not registered for the event
     */
    @GetMapping("/event/{eventId}/me")
    ResponseEntity<RegistrationResponse> getMyRegistrationForEvent(@PathVariable Long eventId) {
        return registrationService.getMyRegistrationForEvent(SecurityUtils.getCurrentUserId(), eventId)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.noContent().build());
    }

    @GetMapping("/{registrationId}")
    RegistrationResponse getRegistration(@PathVariable Long registrationId) {
        return registrationService.getRegistrationById(SecurityUtils.getCurrentUserId(), registrationId);
    }

    @PatchMapping("/{registrationId}/cancel")
    RegistrationResponse cancelRegistration(@PathVariable Long registrationId) {
        return registrationService.cancelRegistration(SecurityUtils.getCurrentUserId(), registrationId);
    }

    @PatchMapping("/{registrationId}/confirm")
    RegistrationResponse confirmRegistration(@PathVariable Long registrationId) {
        return registrationService.confirmRegistration(registrationId);
    }

    @GetMapping("/event/{eventId}")
    List<RegistrationResponse> getEventRegistrations(@PathVariable Long eventId,
                                                     @RequestParam(required = false) RegistrationStatus status) {
        return registrationService.getEventRegistrations(eventId, status);
    }

    @GetMapping(value = "/event/{eventId}/export", produces = "text/csv")
    ResponseEntity<String> exportEventRegistrations(@PathVariable Long eventId) {
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"attendees-event-" + eventId + ".csv\"")
                .contentType(MediaType.parseMediaType("text/csv"))
                .body(registrationService.exportEventRegistrationsCsv(eventId));
    }

    @PostMapping("/check-in")
    RegistrationResponse checkIn(@Valid @RequestBody CheckInRequest request) {
        return registrationService.checkIn(request);
    }

}
