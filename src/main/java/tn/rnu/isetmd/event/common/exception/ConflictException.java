package tn.rnu.isetmd.event.common.exception;

/**
 * HTTP 409 - the request conflicts with the current state.
 */
public class ConflictException extends RuntimeException {
    public ConflictException(String message) {
        super(message);
    }
}
