package gestao_de_assinaturas.mateus.entity;

import gestao_de_assinaturas.mateus.enums.Plans;
import gestao_de_assinaturas.mateus.enums.SubscriptionStatus;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Data;

import java.time.Instant;
import java.time.LocalDate;

@Entity
@Data
@Table(name = "subcriptions")
public class Subscription {

    @Id
    private Long idSubscription;

    private Long userId;

    private SubscriptionStatus status;

    private Plans plans;

    private LocalDate startSubscription;

    private LocalDate endSubscription;

    private Instant createdAt;

    private Instant updatedAt;




}
