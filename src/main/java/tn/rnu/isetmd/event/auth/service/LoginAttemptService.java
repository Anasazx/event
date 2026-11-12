package tn.rnu.isetmd.event.auth.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import tn.rnu.isetmd.event.common.exception.TooManyRequestsException;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Brute-force protection: after {@code maxAttempts} failed logins for the same email within
 * the lock window, further attempts are refused with HTTP 429 until the window expires.
 * State is kept in memory (single API instance, see SYSTEM_DESIGN §12 for a shared store).
 */
@Component
public class LoginAttemptService {

    private static final int PURGE_THRESHOLD = 10_000;

    private final int maxAttempts;
    private final Duration lockDuration;
    private final Clock clock;
    private final Map<String, Attempts> attempts = new ConcurrentHashMap<>();

    @Autowired
    public LoginAttemptService(
            @Value("${app.security.login.max-attempts:5}") int maxAttempts,
            @Value("${app.security.login.lock-minutes:15}") long lockMinutes
    ) {
        this(maxAttempts, Duration.ofMinutes(lockMinutes), Clock.systemUTC());
    }

    public LoginAttemptService(int maxAttempts, Duration lockDuration, Clock clock) {
        this.maxAttempts = maxAttempts;
        this.lockDuration = lockDuration;
        this.clock = clock;
    }

    /**
     * Throws when the account is temporarily locked
     */
    public void checkAllowed(String email) {
        Attempts current = attempts.get(key(email));
        if (current == null) {
            return;
        }
        if (current.isExpired(clock.instant(), lockDuration)) {
            attempts.remove(key(email), current);
            return;
        }
        if (current.count() >= maxAttempts) {
            long seconds = Duration.between(clock.instant(), current.firstFailure().plus(lockDuration)).toSeconds();
            long minutes = Math.max(1, (seconds + 59) / 60);
            throw new TooManyRequestsException(
                    "Too many failed login attempts. Try again in " + minutes + " minute" + (minutes > 1 ? "s" : ""));
        }
    }

    public void loginFailed(String email) {
        Instant now = clock.instant();
        attempts.compute(key(email), (k, current) ->
                current == null || current.isExpired(now, lockDuration)
                        ? new Attempts(1, now)
                        : new Attempts(current.count() + 1, current.firstFailure()));
        if (attempts.size() > PURGE_THRESHOLD) {
            attempts.values().removeIf(value -> value.isExpired(now, lockDuration));
        }
    }

    public void loginSucceeded(String email) {
        attempts.remove(key(email));
    }

    private String key(String email) {
        return email == null ? "" : email.trim().toLowerCase();
    }

    private record Attempts(int count, Instant firstFailure) {
        boolean isExpired(Instant now, Duration window) {
            return !now.isBefore(firstFailure.plus(window));
        }
    }
}
