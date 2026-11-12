package tn.rnu.isetmd.event.common.exception;

/**
 * HTTP 429 - the client sent too many requests (e.g. repeated failed logins).
 */
public class TooManyRequestsException extends RuntimeException {
    public TooManyRequestsException(String message) {
        super(message);
    }
}
