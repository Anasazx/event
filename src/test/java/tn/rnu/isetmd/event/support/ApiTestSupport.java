package tn.rnu.isetmd.event.support;

import com.jayway.jsonpath.JsonPath;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import tn.rnu.isetmd.event.category.entity.Category;
import tn.rnu.isetmd.event.category.repository.CategoryRepository;
import tn.rnu.isetmd.event.enums.UserRole;
import tn.rnu.isetmd.event.user.entity.User;
import tn.rnu.isetmd.event.user.repository.UserRepository;
import tn.rnu.isetmd.event.venue.entity.Venue;
import tn.rnu.isetmd.event.venue.repository.VenueRepository;

import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Base class for HTTP level tests: full application context on an in-memory H2 database.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public abstract class ApiTestSupport {

    @Autowired
    protected MockMvc mockMvc;

    @Autowired
    protected UserRepository userRepository;

    @Autowired
    protected CategoryRepository categoryRepository;

    @Autowired
    protected VenueRepository venueRepository;

    @Autowired
    protected PasswordEncoder passwordEncoder;

    protected ResultActions perform(MockHttpServletRequestBuilder request, String token, String body) throws Exception {
        if (token != null) {
            request.header("Authorization", "Bearer " + token);
        }
        if (body != null) {
            request.contentType(MediaType.APPLICATION_JSON).content(body);
        }
        return mockMvc.perform(request);
    }

    protected ResultActions get(String url, String token) throws Exception {
        return perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get(url), token, null);
    }

    protected ResultActions post(String url, String token, String body) throws Exception {
        return perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post(url), token, body);
    }

    protected ResultActions put(String url, String token, String body) throws Exception {
        return perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put(url), token, body);
    }

    protected ResultActions patch(String url, String token, String body) throws Exception {
        return perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch(url), token, body);
    }

    protected ResultActions delete(String url, String token) throws Exception {
        return perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete(url), token, null);
    }

    protected <T> T read(ResultActions result, String jsonPath) throws Exception {
        return JsonPath.read(result.andReturn().getResponse().getContentAsString(), jsonPath);
    }

    protected Long readId(ResultActions result, String jsonPath) throws Exception {
        return ((Number) read(result, jsonPath)).longValue();
    }

    /**
     * Registers a new account through the API and returns its JWT
     */
    protected String registerUser() throws Exception {
        String email = "user-" + UUID.randomUUID() + "@test.tn";
        ResultActions result = post("/api/auth/register", null, """
                {"firstName":"Test","lastName":"User","email":"%s","password":"Password1"}
                """.formatted(email)).andExpect(status().isCreated());
        return read(result, "$.token");
    }

    protected String createUserAndLogin(UserRole role) throws Exception {
        String email = role.name().toLowerCase() + "-" + UUID.randomUUID() + "@test.tn";
        User user = new User("Test", role.name(), email, passwordEncoder.encode("Password1"));
        user.setRole(role);
        userRepository.save(user);
        return login(email, "Password1");
    }

    protected String login(String email, String password) throws Exception {
        ResultActions result = post("/api/auth/login", null, """
                {"email":"%s","password":"%s"}
                """.formatted(email, password)).andExpect(status().isOk());
        return read(result, "$.token");
    }

    protected Category createCategory() {
        Category category = new Category();
        category.setName("Category " + UUID.randomUUID());
        return categoryRepository.save(category);
    }

    protected Venue createVenue(Integer capacity) {
        Venue venue = new Venue();
        venue.setName("Venue " + UUID.randomUUID());
        venue.setAddress("1 Test street");
        venue.setCity("Mahdia");
        venue.setCountry("Tunisia");
        venue.setCapacity(capacity);
        return venueRepository.save(venue);
    }
}
