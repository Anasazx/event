package tn.rnu.isetmd.event.auth.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.hibernate.annotations.CreationTimestamp;
import tn.rnu.isetmd.event.user.entity.User;

import java.time.LocalDateTime;

/**
 * One-time password reset link. Only the SHA-256 hash of the token is stored,
 * so a database leak does not give access to pending reset links.
 */
@Data
@FieldDefaults(level = AccessLevel.PRIVATE)
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "password_reset_tokens")
public class PasswordResetToken {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long id;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    User user;

    @Column(nullable = false, unique = true, length = 64)
    String tokenHash;

    @Column(nullable = false)
    LocalDateTime expiresAt;

    LocalDateTime usedAt;

    @CreationTimestamp
    @Column(updatable = false)
    LocalDateTime createdAt;

    public boolean isUsable(LocalDateTime now) {
        return usedAt == null && now.isBefore(expiresAt);
    }
}
