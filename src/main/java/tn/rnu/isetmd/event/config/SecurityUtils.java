package tn.rnu.isetmd.event.config;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

public final class SecurityUtils {

    private SecurityUtils() {
    }

    public static AuthenticatedUser getCurrentUser() {

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null || !(authentication.getPrincipal() instanceof AuthenticatedUser user)) {
            throw new IllegalStateException("No authenticated user");
        }

        return user;
    }

    public static Long getCurrentUserId() {
        return getCurrentUser().id();
    }

    public static String getCurrentUserEmail() {
        return getCurrentUser().email();
    }
}