package tn.rnu.isetmd.event.category.dto;

public record CategoryResponse(
        Long id,
        String name,
        String description,
        String image
) {}
