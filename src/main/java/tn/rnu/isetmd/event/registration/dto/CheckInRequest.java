package tn.rnu.isetmd.event.registration.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

/**
 * @param confirmPayment when true, a pending (unpaid) registration is confirmed on the spot before the check-in
 */
public record CheckInRequest(
        @NotNull
        Long eventId,
        @NotBlank
        String qrCode,
        Boolean confirmPayment
) {
    public boolean shouldConfirmPayment() {
        return Boolean.TRUE.equals(confirmPayment);
    }
}
