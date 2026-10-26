package tn.rnu.isetmd.event.common.exception;

/**
 * HTTP 403 - the current user is not allowed to perform this action.
 */
public class ForbiddenException extends RuntimeException {
    public ForbiddenException(String message) {
        super(message);
    }
}
