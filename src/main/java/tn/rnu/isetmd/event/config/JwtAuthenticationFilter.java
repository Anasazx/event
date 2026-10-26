package tn.rnu.isetmd.event.config;

import io.jsonwebtoken.JwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.jspecify.annotations.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import tn.rnu.isetmd.event.user.repository.UserRepository;

import java.io.IOException;
import java.util.List;

/**
 * Reads the "Authorization: Bearer &lt;jwt&gt;" header and authenticates the request.
 * The user is reloaded from the database so that role changes and disabled
 * accounts take effect immediately, without waiting for the token to expire.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final UserRepository userRepository;

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain
    ) throws ServletException, IOException {

        String authHeader = request.getHeader("Authorization");

        // No JWT -> continue the request as anonymous
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        String token = authHeader.substring(7);

        try {
            Long userId = jwtService.extractUserId(token);

            if (userId != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                userRepository.findById(userId)
                        .filter(user -> user.isEnabled())
                        .ifPresent(user -> {
                            AuthenticatedUser authenticatedUser =
                                    new AuthenticatedUser(user.getId(), user.getEmail(), user.getRole());

                            UsernamePasswordAuthenticationToken authentication =
                                    new UsernamePasswordAuthenticationToken(
                                            authenticatedUser,
                                            null,
                                            List.of(new SimpleGrantedAuthority("ROLE_" + user.getRole().name()))
                                    );

                            SecurityContextHolder.getContext().setAuthentication(authentication);
                        });
            }

        } catch (JwtException | IllegalArgumentException e) {
            // Invalid/expired JWT -> don't authenticate, protected routes will answer 401
            log.debug("Rejected JWT: {}", e.getMessage());
            SecurityContextHolder.clearContext();
        }

        filterChain.doFilter(request, response);
    }
}
