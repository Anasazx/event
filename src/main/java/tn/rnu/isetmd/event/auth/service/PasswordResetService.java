package tn.rnu.isetmd.event.auth.service;

import tn.rnu.isetmd.event.auth.dto.ForgotPasswordResponse;
import tn.rnu.isetmd.event.auth.dto.ResetPasswordRequest;

public interface PasswordResetService {
    ForgotPasswordResponse requestReset(String email);
    void resetPassword(ResetPasswordRequest request);
}
