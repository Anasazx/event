package tn.rnu.isetmd.event.unit;

import org.junit.jupiter.api.Test;
import tn.rnu.isetmd.event.auth.service.LoginAttemptService;
import tn.rnu.isetmd.event.common.exception.TooManyRequestsException;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneId;
import java.time.ZoneOffset;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class LoginAttemptServiceTest {

    private final MutableClock clock = new MutableClock(Instant.parse("2026-01-01T10:00:00Z"));
    private final LoginAttemptService service = new LoginAttemptService(3, Duration.ofMinutes(15), clock);

    @Test
    void locksTheAccountAfterTooManyFailuresUntilTheWindowExpires() {
        for (int i = 0; i < 3; i++) {
            assertThatCode(() -> service.checkAllowed("User@Test.tn")).doesNotThrowAnyException();
            service.loginFailed("user@test.tn");
        }

        // Email comparison ignores case and surrounding spaces
        assertThatThrownBy(() -> service.checkAllowed(" USER@test.tn "))
                .isInstanceOf(TooManyRequestsException.class)
                .hasMessageContaining("15 minutes");
        assertThatCode(() -> service.checkAllowed("other@test.tn")).doesNotThrowAnyException();

        clock.advance(Duration.ofMinutes(15));
        assertThatCode(() -> service.checkAllowed("user@test.tn")).doesNotThrowAnyException();
    }

    @Test
    void successfulLoginResetsTheCounter() {
        service.loginFailed("user@test.tn");
        service.loginFailed("user@test.tn");
        service.loginSucceeded("user@test.tn");
        service.loginFailed("user@test.tn");
        service.loginFailed("user@test.tn");

        assertThatCode(() -> service.checkAllowed("user@test.tn")).doesNotThrowAnyException();
    }

    private static final class MutableClock extends Clock {
        private Instant now;

        MutableClock(Instant now) {
            this.now = now;
        }

        void advance(Duration duration) {
            now = now.plus(duration);
        }

        @Override
        public ZoneId getZone() {
            return ZoneOffset.UTC;
        }

        @Override
        public Clock withZone(ZoneId zone) {
            return this;
        }

        @Override
        public Instant instant() {
            return now;
        }
    }
}
