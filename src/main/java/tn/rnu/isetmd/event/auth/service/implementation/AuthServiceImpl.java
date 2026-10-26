package tn.rnu.isetmd.event.auth.service.implementation;

import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tn.rnu.isetmd.event.auth.dto.AuthResponse;
import tn.rnu.isetmd.event.auth.dto.LoginRequest;
import tn.rnu.isetmd.event.auth.dto.RegisterRequest;
import tn.rnu.isetmd.event.auth.service.AuthService;
import tn.rnu.isetmd.event.common.exception.ConflictException;
import tn.rnu.isetmd.event.common.exception.ForbiddenException;
import tn.rnu.isetmd.event.common.exception.UnauthorizedException;
import tn.rnu.isetmd.event.config.JwtService;
import tn.rnu.isetmd.event.notification.service.NotificationService;
import tn.rnu.isetmd.event.enums.NotificationType;
import tn.rnu.isetmd.event.user.entity.User;
import tn.rnu.isetmd.event.user.mapper.UserMapper;
import tn.rnu.isetmd.event.user.repository.UserRepository;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final JwtService jwtService;
    private final PasswordEncoder passwordEncoder;
    private final UserMapper userMapper;
    private final NotificationService notificationService;

    @Override
    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest loginRequest) {

        // Same message for unknown email and wrong password, to avoid leaking which accounts exist
        User user = userRepository.findByEmailIgnoreCase(loginRequest.email().trim())
                .filter(found -> passwordEncoder.matches(loginRequest.password(), found.getPassword()))
                .orElseThrow(() -> new UnauthorizedException("Invalid email or password"));

        if (!user.isEnabled()) {
            throw new ForbiddenException("This account has been disabled");
        }

        return buildResponse(user);
    }

    @Override
    @Transactional
    public AuthResponse register(RegisterRequest registerRequest) {

        String email = registerRequest.email().trim().toLowerCase();

        if (userRepository.existsByEmailIgnoreCase(email)) {
            throw new ConflictException("An account with this email already exists");
        }

        User newUser = new User(
                registerRequest.firstName().trim(),
                registerRequest.lastName().trim(),
                email,
                passwordEncoder.encode(registerRequest.password())
        );

        User savedUser = userRepository.save(newUser);

        notificationService.notify(
                savedUser,
                null,
                NotificationType.SYSTEM,
                "Welcome to EventHub",
                "Your account is ready. Browse upcoming events and grab your first ticket!"
        );

        return buildResponse(savedUser);
    }

    private AuthResponse buildResponse(User user) {
        String token = jwtService.generateToken(user.getId(), user.getEmail(), user.getRole().name());
        return new AuthResponse(token, jwtService.getExpiration(), userMapper.toUserResponse(user));
    }

}
