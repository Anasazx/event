package tn.rnu.isetmd.event.ticketType.entity;

import tn.rnu.isetmd.event.event.entity.Event;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.ToString;
import lombok.experimental.FieldDefaults;
import org.hibernate.annotations.DynamicUpdate;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@FieldDefaults(level = AccessLevel.PRIVATE)
@NoArgsConstructor
@AllArgsConstructor
@Entity
@DynamicUpdate
@Table(name = "ticket_types")
public class TicketType {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long id;

    @ToString.Exclude
    @ManyToOne
    @JoinColumn(name = "event_id", nullable = false)
    Event event;

    @Column(nullable = false)
    String name;

    @Column(length = 1000)
    String description;

    @Column(nullable = false, precision = 10, scale = 2)
    BigDecimal price;

    @Column(nullable = false)
    int quantity;

    @Column(nullable = false)
    int soldQuantity = 0;

    LocalDateTime saleStart;

    LocalDateTime saleEnd;

    @Column(nullable = false)
    boolean active = true;

    public int getAvailable() {
        return Math.max(quantity - soldQuantity, 0);
    }

    /**
     * Active, not sold out and inside the optional sale window
     */
    public boolean isOnSale(LocalDateTime now) {
        return active
                && getAvailable() > 0
                && (saleStart == null || !now.isBefore(saleStart))
                && (saleEnd == null || now.isBefore(saleEnd));
    }

}