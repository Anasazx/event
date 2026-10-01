package tn.rnu.isetmd.event.auth.service.implementation;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import tn.rnu.isetmd.event.auth.dto.AuthResponse;
import tn.rnu.isetmd.event.auth.dto.LoginRequest;
import tn.rnu.isetmd.event.auth.dto.RegisterRequest;
import tn.rnu.isetmd.event.auth.service.AuthService;
import tn.rnu.isetmd.event.config.JwtService;
import tn.rnu.isetmd.event.user.entity.User;
import tn.rnu.isetmd.event.user.repository.UserRepository;

import java.util.Optional;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final JwtService jwtService;

    @Override
    public AuthResponse login(LoginRequest loginRequest) {

        if (loginRequest.email() == null || !isPasswordValid(loginRequest.password())) {
            throw new RuntimeException("Email or password invalid");
        }

        Optional<User> optUser = userRepository.findByEmail(loginRequest.email());

        if (optUser.isEmpty()) {
            throw new RuntimeException("User not found");
        }

        User user = optUser.get();

        if (!user.getPassword().equals(loginRequest.password())) {
            throw new RuntimeException("Passwords don't match");
        }

        String token = jwtService.generateToken(user.getId(), user.getEmail());

        return new AuthResponse(token, user.getRole().name(), user.getFirstName());
    }

    @Override
    public AuthResponse register(RegisterRequest registerRequest) {

        if (registerRequest.email() == null || !isPasswordValid(registerRequest.password())) {
            throw new RuntimeException("Email or password invalid");
        }

        Optional<User> optUser = userRepository.findByEmail(registerRequest.email());

        if (optUser.isPresent()) {
            throw new RuntimeException("User already exists");
        }

        User newUser = new User(
                registerRequest.firstName(),
                registerRequest.lastName(),
                registerRequest.email(),
                registerRequest.password()
        );

        User savedUser = userRepository.save(newUser);

        String token = jwtService.generateToken(savedUser.getId(), savedUser.getEmail());

        return new AuthResponse(token, savedUser.getRole().name(), savedUser.getFirstName());
    }

    boolean isPasswordValid(String password) {
        return password != null && !password.isBlank() && password.length() >= 8;
    }



}
