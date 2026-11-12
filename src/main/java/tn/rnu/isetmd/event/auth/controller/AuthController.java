package tn.rnu.isetmd.event.auth.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import tn.rnu.isetmd.event.auth.dto.AuthResponse;
import tn.rnu.isetmd.event.auth.dto.ForgotPasswordRequest;
import tn.rnu.isetmd.event.auth.dto.ForgotPasswordResponse;
import tn.rnu.isetmd.event.auth.dto.LoginRequest;
import tn.rnu.isetmd.event.auth.dto.RegisterRequest;
import tn.rnu.isetmd.event.auth.dto.ResetPasswordRequest;
import tn.rnu.isetmd.event.auth.service.AuthService;
import tn.rnu.isetmd.event.auth.service.PasswordResetService;
import tn.rnu.isetmd.event.config.SecurityUtils;
import tn.rnu.isetmd.event.user.dto.UserResponse;
import tn.rnu.isetmd.event.user.service.UserService;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final UserService userService;
    private final PasswordResetService passwordResetService;

    @PostMapping("/login")
    AuthResponse login(@Valid @RequestBody LoginRequest loginRequest) {
        return authService.login(loginRequest);
    }

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    AuthResponse register(@Valid @RequestBody RegisterRequest registerRequest) {
        return authService.register(registerRequest);
    }

    @PostMapping("/forgot-password")
    ForgotPasswordResponse forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        return passwordResetService.requestReset(request.email());
    }

    @PostMapping("/reset-password")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    void resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        passwordResetService.resetPassword(request);
    }

    @GetMapping("/me")
    UserResponse me() {
        return userService.getUserById(SecurityUtils.getCurrentUserId());
    }

}
