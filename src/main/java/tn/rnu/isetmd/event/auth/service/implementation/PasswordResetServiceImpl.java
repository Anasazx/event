package tn.rnu.isetmd.event.auth.service.implementation;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tn.rnu.isetmd.event.auth.dto.ForgotPasswordResponse;
import tn.rnu.isetmd.event.auth.dto.ResetPasswordRequest;
import tn.rnu.isetmd.event.auth.entity.PasswordResetToken;
import tn.rnu.isetmd.event.auth.repository.PasswordResetTokenRepository;
import tn.rnu.isetmd.event.auth.service.LoginAttemptService;
import tn.rnu.isetmd.event.auth.service.PasswordResetService;
import tn.rnu.isetmd.event.common.exception.BadRequestException;
import tn.rnu.isetmd.event.enums.NotificationType;
import tn.rnu.isetmd.event.mail.service.MailService;
import tn.rnu.isetmd.event.notification.service.NotificationService;
import tn.rnu.isetmd.event.user.entity.User;
import tn.rnu.isetmd.event.user.repository.UserRepository;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.HexFormat;
import java.util.Optional;

@Service
@Transactional
public class PasswordResetServiceImpl implements PasswordResetService {

    private static final String GENERIC_MESSAGE =
            "If an account exists for this email, a password reset link has been sent to it.";
    private static final SecureRandom RANDOM = new SecureRandom();

    private final UserRepository userRepository;
    private final PasswordResetTokenRepository tokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final MailService mailService;
    private final NotificationService notificationService;
    private final LoginAttemptService loginAttemptService;
    private final String frontendUrl;
    private final Duration validity;
    private final boolean demoMode;

    public PasswordResetServiceImpl(
            UserRepository userRepository,
            PasswordResetTokenRepository tokenRepository,
            PasswordEncoder passwordEncoder,
            MailService mailService,
            NotificationService notificationService,
            LoginAttemptService loginAttemptService,
            @Value("${app.frontend-url}") String frontendUrl,
            @Value("${app.password-reset.validity-minutes:30}") long validityMinutes,
            @Value("${app.mail.demo-mode:true}") boolean demoMode
    ) {
        this.userRepository = userRepository;
        this.tokenRepository = tokenRepository;
        this.passwordEncoder = passwordEncoder;
        this.mailService = mailService;
        this.notificationService = notificationService;
        this.loginAttemptService = loginAttemptService;
        this.frontendUrl = frontendUrl.replaceAll("/+$", "");
        this.validity = Duration.ofMinutes(validityMinutes);
        this.demoMode = demoMode;
    }

    /**
     * Always answers the same message so the endpoint can't be used to find out which emails are registered.
     * In demo mode the link is also returned, because no real e-mail is delivered.
     */
    @Override
    public ForgotPasswordResponse requestReset(String email) {
        Optional<User> found = userRepository.findByEmailIgnoreCase(email.trim()).filter(User::isEnabled);
        if (found.isEmpty()) {
            return new ForgotPasswordResponse(GENERIC_MESSAGE, null);
        }

        User user = found.get();
        LocalDateTime now = LocalDateTime.now();
        tokenRepository.invalidateAllForUser(user.getId(), now);

        String rawToken = generateToken();
        PasswordResetToken token = new PasswordResetToken();
        token.setUser(user);
        token.setTokenHash(hash(rawToken));
        token.setExpiresAt(now.plus(validity));
        tokenRepository.save(token);

        String link = frontendUrl + "/auth/reset-password?token=" + rawToken;
        mailService.send(user.getEmail(), "Reset your EventHub password", """
                Hello %s,

                We received a request to reset your EventHub password.
                Open this link to choose a new one (valid for %d minutes):

                %s

                If you didn't ask for this, you can ignore this e-mail: your password stays the same.
                """.formatted(user.getFirstName(), validity.toMinutes(), link));

        return new ForgotPasswordResponse(GENERIC_MESSAGE, demoMode ? link : null);
    }

    @Override
    public void resetPassword(ResetPasswordRequest request) {
        LocalDateTime now = LocalDateTime.now();
        PasswordResetToken token = tokenRepository.findByTokenHash(hash(request.token().trim()))
                .filter(found -> found.isUsable(now))
                .orElseThrow(() -> new BadRequestException("This reset link is invalid or has expired"));

        User user = token.getUser();
        if (!user.isEnabled()) {
            throw new BadRequestException("This account has been disabled");
        }

        user.setPassword(passwordEncoder.encode(request.newPassword()));
        userRepository.save(user);
        tokenRepository.invalidateAllForUser(user.getId(), now);
        loginAttemptService.loginSucceeded(user.getEmail());

        notificationService.notify(user, null, NotificationType.SYSTEM,
                "Password changed",
                "Your password was reset. If it wasn't you, contact an administrator immediately.");
    }

    /**
     * 256 random bits, URL safe
     */
    private String generateToken() {
        byte[] bytes = new byte[32];
        RANDOM.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private String hash(String token) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256").digest(token.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(digest);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 not available", e);
        }
    }
}
