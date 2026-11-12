package tn.rnu.isetmd.event.mail.service.implementation;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import tn.rnu.isetmd.event.mail.service.MailService;

/**
 * Development mail sender: e-mails are written to the application log instead of being delivered.
 */
@Slf4j
@Service
public class ConsoleMailService implements MailService {

    @Override
    public void send(String to, String subject, String body) {
        log.info("""

                ----------------------- E-MAIL (not sent, console mode) -----------------------
                To:      {}
                Subject: {}

                {}
                --------------------------------------------------------------------------------""", to, subject, body);
    }
}
