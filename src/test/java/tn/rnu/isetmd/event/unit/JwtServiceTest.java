package tn.rnu.isetmd.event.unit;

import io.jsonwebtoken.JwtException;
import org.junit.jupiter.api.Test;
import tn.rnu.isetmd.event.config.JwtService;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class JwtServiceTest {

    private static final String SECRET = "test-secret-that-is-long-enough-for-hs256";

    @Test
    void generatedTokenCarriesTheUserIdentity() {
        JwtService jwtService = new JwtService(SECRET, 60_000);
        String token = jwtService.generateToken(42L, "user@test.tn", "USER");

        assertThat(jwtService.extractUserId(token)).isEqualTo(42L);
        assertThat(jwtService.extractEmail(token)).isEqualTo("user@test.tn");
    }

    @Test
    void expiredOrForeignTokensAreRejected() {
        JwtService expired = new JwtService(SECRET, -1_000);
        String expiredToken = expired.generateToken(1L, "a@test.tn", "USER");
        assertThatThrownBy(() -> expired.extractUserId(expiredToken)).isInstanceOf(JwtException.class);

        String foreignToken = new JwtService("another-secret-that-is-long-enough-hs256", 60_000)
                .generateToken(1L, "a@test.tn", "USER");
        assertThatThrownBy(() -> new JwtService(SECRET, 60_000).extractUserId(foreignToken))
                .isInstanceOf(JwtException.class);
    }
}
