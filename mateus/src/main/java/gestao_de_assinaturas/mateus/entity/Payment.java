package gestao_de_assinaturas.mateus.entity;

import gestao_de_assinaturas.mateus.enums.PaymentStatus;
import jakarta.persistence.*;
import lombok.Data;

import java.time.Instant;

@Entity
@Data
@Table(name = "payments")
public class Payment {

    @Id
    @GeneratedValue (strategy = GenerationType.IDENTITY)
    private Long userId;

    @Column (name = "created_at", nullable = false)
    private Instant createdAt;

    @Column (name = "updated_at", nullable = false)
    private Instant updatedAt;

    @OneToOne (fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id_id")
    private User user;

    @Enumerated (EnumType.STRING)
    private PaymentStatus status;

}
