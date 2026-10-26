package tn.rnu.isetmd.event.auth.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import tn.rnu.isetmd.event.auth.dto.AuthResponse;
import tn.rnu.isetmd.event.auth.dto.LoginRequest;
import tn.rnu.isetmd.event.auth.dto.RegisterRequest;
import tn.rnu.isetmd.event.auth.service.AuthService;
import tn.rnu.isetmd.event.config.SecurityUtils;
import tn.rnu.isetmd.event.user.dto.UserResponse;
import tn.rnu.isetmd.event.user.service.UserService;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final UserService userService;

    @PostMapping("/login")
    AuthResponse login(@Valid @RequestBody LoginRequest loginRequest) {
        return authService.login(loginRequest);
    }

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    AuthResponse register(@Valid @RequestBody RegisterRequest registerRequest) {
        return authService.register(registerRequest);
    }

    @GetMapping("/me")
    UserResponse me() {
        return userService.getUserById(SecurityUtils.getCurrentUserId());
    }

}
