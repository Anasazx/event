package tn.rnu.isetmd.event.common.exception;

/**
 * HTTP 401 - the request lacks valid credentials.
 */
public class UnauthorizedException extends RuntimeException {
    public UnauthorizedException(String message) {
        super(message);
    }
}
