package tn.rnu.isetmd.event.config;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import tn.rnu.isetmd.event.common.exception.UnauthorizedException;
import tn.rnu.isetmd.event.enums.UserRole;

import java.util.Optional;

public final class SecurityUtils {

    private SecurityUtils() {
    }

    public static Optional<AuthenticatedUser> findCurrentUser() {

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication != null && authentication.getPrincipal() instanceof AuthenticatedUser user) {
            return Optional.of(user);
        }

        return Optional.empty();
    }

    public static AuthenticatedUser getCurrentUser() {
        return findCurrentUser().orElseThrow(() -> new UnauthorizedException("Authentication required"));
    }

    public static Long getCurrentUserId() {
        return getCurrentUser().id();
    }

    /**
     * Returns the id of the authenticated user, or null for anonymous requests on public endpoints.
     */
    public static Long getCurrentUserIdOrNull() {
        return findCurrentUser().map(AuthenticatedUser::id).orElse(null);
    }

    public static String getCurrentUserEmail() {
        return getCurrentUser().email();
    }

    public static boolean isAdmin() {
        return findCurrentUser().map(user -> user.role() == UserRole.ADMIN).orElse(false);
    }
}
