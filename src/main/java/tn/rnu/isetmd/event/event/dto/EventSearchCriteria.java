package tn.rnu.isetmd.event.event.dto;

import java.time.LocalDate;

/**
 * Public catalogue filters, every field is optional
 */
public record EventSearchCriteria(
        String keyword,
        Long categoryId,
        String city,
        Long organizationId,
        LocalDate from,
        LocalDate to,
        boolean freeOnly,
        boolean includePast
) {}
