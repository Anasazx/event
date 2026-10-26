package tn.rnu.isetmd.event.common.exception;

/**
 * HTTP 404 - the requested resource does not exist.
 */
public class NotFoundException extends RuntimeException {
    public NotFoundException(String message) {
        super(message);
    }
}
