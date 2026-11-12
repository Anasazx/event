package tn.rnu.isetmd.event.mail.service;

/**
 * Outgoing e-mails. The project ships with a console implementation (no SMTP server needed);
 * a real sender (Spring Mail, SendGrid...) only has to implement this interface.
 */
public interface MailService {
    void send(String to, String subject, String body);
}
