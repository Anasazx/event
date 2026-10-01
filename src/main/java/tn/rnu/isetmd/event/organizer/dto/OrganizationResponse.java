package tn.rnu.isetmd.event.organizer.dto;

import java.time.LocalDateTime;

public record OrganizationResponse(
   Long id,
   String name,
   String phone,
   String website,
   String description,
   String logo,
   boolean verified,
   LocalDateTime createdAt
) {}