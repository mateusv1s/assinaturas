package gestao_de_assinaturas.mateus.entity;

import gestao_de_assinaturas.mateus.enums.UserRole;
import jakarta.persistence.*;
import lombok.Data;

import java.time.Instant;

@Entity
@Data
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue (strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    private String email;

    private String password;

    private UserRole role;

    private Instant createdAt;

    private Instant updatedAt;

}
