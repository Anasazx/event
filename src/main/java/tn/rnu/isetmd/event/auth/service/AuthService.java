package tn.rnu.isetmd.event.auth.service;

import tn.rnu.isetmd.event.auth.dto.AuthResponse;
import tn.rnu.isetmd.event.auth.dto.LoginRequest;
import tn.rnu.isetmd.event.auth.dto.RegisterRequest;

public interface AuthService {
    AuthResponse login(LoginRequest loginRequest);
    AuthResponse register(RegisterRequest registerRequest);
}
