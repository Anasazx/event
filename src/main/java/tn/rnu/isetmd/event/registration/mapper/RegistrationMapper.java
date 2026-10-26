package tn.rnu.isetmd.event.registration.mapper;

import org.springframework.stereotype.Component;
import tn.rnu.isetmd.event.event.entity.Event;
import tn.rnu.isetmd.event.registration.dto.RegistrationResponse;
import tn.rnu.isetmd.event.registration.entity.Registration;

@Component
public class RegistrationMapper {

    /**
     * @param includeQrCode the QR code is a bearer ticket, only its owner receives it
     */
    public RegistrationResponse toRegistrationResponse(Registration registration, boolean includeQrCode) {
        Event event = registration.getEvent();
        return new RegistrationResponse(
                registration.getId(),
                registration.getStatus(),
                includeQrCode ? registration.getQrCode() : null,
                registration.getRegisteredAt(),
                registration.getCheckedInAt(),
                registration.getCancelledAt(),
                registration.getTicketType().getId(),
                registration.getTicketType().getName(),
                registration.getTicketType().getPrice(),
                event.getId(),
                event.getTitle(),
                event.getCoverImage(),
                event.getStartDateTime(),
                event.getEndDateTime(),
                event.getStatus(),
                event.getVenue().getName(),
                event.getVenue().getCity(),
                registration.getUser().getId(),
                registration.getUser().getFullName(),
                registration.getUser().getEmail()
        );
    }

}
