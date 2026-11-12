package tn.rnu.isetmd.event.integration;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.web.servlet.ResultActions;
import tn.rnu.isetmd.event.auth.entity.PasswordResetToken;
import tn.rnu.isetmd.event.auth.repository.PasswordResetTokenRepository;
import tn.rnu.isetmd.event.support.ApiTestSupport;

import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class PasswordResetIntegrationTest extends ApiTestSupport {

    @Autowired
    private PasswordResetTokenRepository tokenRepository;

    @Test
    void resetLinkChangesThePasswordOnlyOnce() throws Exception {
        signUp("reset@test.tn");

        String token = requestReset("reset@test.tn");
        assertThat(tokenRepository.findAll()).noneMatch(stored -> stored.getTokenHash().equals(token));

        resetPassword(token, "NewPassword1").andExpect(status().isNoContent());
        login("reset@test.tn", "NewPassword1");
        post("/api/auth/login", null, """
                {"email":"reset@test.tn","password":"Password1"}
                """).andExpect(status().isUnauthorized());

        // A link can't be used twice
        resetPassword(token, "AnotherPassword1")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("This reset link is invalid or has expired"));
    }

    @Test
    void unknownEmailsGetTheSameAnswerWithoutLink() throws Exception {
        signUp("known@test.tn");

        String known = post("/api/auth/forgot-password", null, """
                {"email":"known@test.tn"}
                """).andExpect(status().isOk()).andReturn().getResponse().getContentAsString();

        post("/api/auth/forgot-password", null, """
                {"email":"nobody@test.tn"}
                """)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.startsWith("If an account exists")))
                .andExpect(jsonPath("$.demoLink").doesNotExist());
        assertThat(known).contains("If an account exists");
    }

    @Test
    void onlyTheLatestLinkIsValidAndExpiredLinksAreRefused() throws Exception {
        signUp("latest@test.tn");

        String first = requestReset("latest@test.tn");
        String second = requestReset("latest@test.tn");
        resetPassword(first, "NewPassword1").andExpect(status().isBadRequest());

        PasswordResetToken stored = tokenRepository.findAll().stream()
                .filter(token -> token.getUser().getEmail().equals("latest@test.tn") && token.getUsedAt() == null).findFirst().orElseThrow();
        stored.setExpiresAt(LocalDateTime.now().minusMinutes(1));
        tokenRepository.save(stored);
        resetPassword(second, "NewPassword1").andExpect(status().isBadRequest());

        resetPassword("not-a-real-token", "NewPassword1").andExpect(status().isBadRequest());
        resetPassword(requestReset("latest@test.tn"), "short")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors.newPassword").exists());
    }

    private void signUp(String email) throws Exception {
        post("/api/auth/register", null, """
                {"firstName":"Reset","lastName":"User","email":"%s","password":"Password1"}
                """.formatted(email)).andExpect(status().isCreated());
    }

    /**
     * Demo mode is on by default: the link is returned instead of being e-mailed
     */
    private String requestReset(String email) throws Exception {
        ResultActions result = post("/api/auth/forgot-password", null, """
                {"email":"%s"}
                """.formatted(email)).andExpect(status().isOk());
        String link = read(result, "$.demoLink");
        assertThat(link).contains("/auth/reset-password?token=");
        return link.substring(link.indexOf("token=") + "token=".length());
    }

    private ResultActions resetPassword(String token, String newPassword) throws Exception {
        return post("/api/auth/reset-password", null, """
                {"token":"%s","newPassword":"%s"}
                """.formatted(token, newPassword));
    }
}
