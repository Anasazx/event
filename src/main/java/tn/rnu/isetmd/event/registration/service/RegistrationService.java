package tn.rnu.isetmd.event.registration.service;

import tn.rnu.isetmd.event.enums.RegistrationStatus;
import tn.rnu.isetmd.event.registration.dto.CheckInRequest;
import tn.rnu.isetmd.event.registration.dto.RegistrationResponse;

import java.util.List;
import java.util.Optional;

public interface RegistrationService {
    RegistrationResponse register(Long userId, Long ticketTypeId);
    List<RegistrationResponse> getMyRegistrations(Long userId);
    Optional<RegistrationResponse> getMyRegistrationForEvent(Long userId, Long eventId);
    RegistrationResponse getRegistrationById(Long userId, Long registrationId);
    RegistrationResponse cancelRegistration(Long userId, Long registrationId);
    RegistrationResponse confirmRegistration(Long registrationId);
    List<RegistrationResponse> getEventRegistrations(Long eventId, RegistrationStatus status);
    String exportEventRegistrationsCsv(Long eventId);
    RegistrationResponse checkIn(CheckInRequest request);
}
