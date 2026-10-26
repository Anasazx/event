package tn.rnu.isetmd.event.common.exception;

/**
 * HTTP 400 - the request violates a business rule.
 */
public class BadRequestException extends RuntimeException {
    public BadRequestException(String message) {
        super(message);
    }
}
