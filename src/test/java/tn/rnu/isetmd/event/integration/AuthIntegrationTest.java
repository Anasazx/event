package tn.rnu.isetmd.event.integration;

import org.junit.jupiter.api.Test;
import tn.rnu.isetmd.event.enums.UserRole;
import tn.rnu.isetmd.event.support.ApiTestSupport;
import tn.rnu.isetmd.event.user.entity.User;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class AuthIntegrationTest extends ApiTestSupport {

    @Test
    void registerHashesThePasswordAndReturnsAToken() throws Exception {
        post("/api/auth/register", null, """
                {"firstName":"Amira","lastName":"Ben Salah","email":"Amira@Test.tn","password":"Password1"}
                """)
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andExpect(jsonPath("$.user.email").value("amira@test.tn"))
                .andExpect(jsonPath("$.user.role").value("USER"));

        User saved = userRepository.findByEmail("amira@test.tn").orElseThrow();
        assertThat(saved.getPassword()).isNotEqualTo("Password1").startsWith("$2");
    }

    @Test
    void registerRejectsInvalidPayloadAndDuplicates() throws Exception {
        post("/api/auth/register", null, """
                {"firstName":"","lastName":"X","email":"not-an-email","password":"short"}
                """)
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors.email").exists())
                .andExpect(jsonPath("$.fieldErrors.password").exists());

        String body = """
                {"firstName":"A","lastName":"B","email":"dup@test.tn","password":"Password1"}
                """;
        post("/api/auth/register", null, body).andExpect(status().isCreated());
        post("/api/auth/register", null, body).andExpect(status().isConflict());
    }

    @Test
    void loginFailsWithWrongPasswordOrDisabledAccount() throws Exception {
        post("/api/auth/register", null, """
                {"firstName":"A","lastName":"B","email":"login@test.tn","password":"Password1"}
                """).andExpect(status().isCreated());

        post("/api/auth/login", null, """
                {"email":"login@test.tn","password":"WrongPassword"}
                """).andExpect(status().isUnauthorized());

        User user = userRepository.findByEmail("login@test.tn").orElseThrow();
        user.setEnabled(false);
        userRepository.save(user);

        post("/api/auth/login", null, """
                {"email":"login@test.tn","password":"Password1"}
                """).andExpect(status().isForbidden());
    }

    @Test
    void protectedEndpointsRequireAValidToken() throws Exception {
        get("/api/auth/me", null).andExpect(status().isUnauthorized());
        get("/api/auth/me", "not-a-jwt").andExpect(status().isUnauthorized());

        String token = registerUser();
        get("/api/auth/me", token).andExpect(status().isOk()).andExpect(jsonPath("$.role").value("USER"));
    }

    @Test
    void adminEndpointsAreRestrictedToAdmins() throws Exception {
        get("/api/admin/stats", registerUser()).andExpect(status().isForbidden());
        get("/api/admin/stats", createUserAndLogin(UserRole.ADMIN)).andExpect(status().isOk());
    }

    @Test
    void publicCatalogueIsReadableAnonymously() throws Exception {
        get("/api/events", null).andExpect(status().isOk()).andExpect(jsonPath("$.content").isArray());
        get("/api/categories", null).andExpect(status().isOk());
        get("/api/venues", null).andExpect(status().isOk());
    }
}
