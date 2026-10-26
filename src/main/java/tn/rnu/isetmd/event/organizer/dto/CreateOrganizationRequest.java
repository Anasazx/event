package tn.rnu.isetmd.event.organizer.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateOrganizationRequest(
        @NotBlank @Size(max = 120)
        String name,
        @Size(max = 30)
        String phone,
        @Size(max = 255)
        String website,
        @Size(max = 2000)
        String description,
        @Email
        String email,
        @Size(max = 255)
        String address,
        String logo
) {}
