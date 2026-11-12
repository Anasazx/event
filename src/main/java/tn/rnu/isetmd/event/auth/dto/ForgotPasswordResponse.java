package tn.rnu.isetmd.event.auth.dto;

/**
 * @param message  always the same, whether the account exists or not
 * @param demoLink the reset link, only filled in demo mode (no real e-mail is sent)
 */
public record ForgotPasswordResponse(
        String message,
        String demoLink
) {}
