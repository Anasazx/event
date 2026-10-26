package tn.rnu.isetmd.event.ticketType.mapper;

import org.springframework.stereotype.Component;
import tn.rnu.isetmd.event.ticketType.dto.TicketTypeRequest;
import tn.rnu.isetmd.event.ticketType.dto.TicketTypeResponse;
import tn.rnu.isetmd.event.ticketType.entity.TicketType;

import java.time.LocalDateTime;

@Component
public class TicketTypeMapper {

    public TicketTypeResponse toTicketTypeResponse(TicketType ticketType) {
        return new TicketTypeResponse(
                ticketType.getId(),
                ticketType.getEvent().getId(),
                ticketType.getName(),
                ticketType.getDescription(),
                ticketType.getPrice(),
                ticketType.getQuantity(),
                ticketType.getSoldQuantity(),
                ticketType.getAvailable(),
                ticketType.getSaleStart(),
                ticketType.getSaleEnd(),
                ticketType.isActive(),
                ticketType.isOnSale(LocalDateTime.now())
        );
    }

    public void updateEntity(TicketType ticketType, TicketTypeRequest request) {
        ticketType.setName(request.name().trim());
        ticketType.setDescription(request.description());
        ticketType.setPrice(request.price());
        ticketType.setQuantity(request.quantity());
        ticketType.setSaleStart(request.saleStart());
        ticketType.setSaleEnd(request.saleEnd());
        if (request.active() != null) {
            ticketType.setActive(request.active());
        }
    }

}
