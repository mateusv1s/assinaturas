package gestao_de_assinaturas.mateus.repository;

import gestao_de_assinaturas.mateus.entity.User;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.hibernate.internal.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;


@Repository
public interface UserRepository extends JpaRepository <User, Long> {

    boolean existsByEmailIgnoreCase(@NotBlank @Email @Size(max = 255) String email);

    Optional<User> findByEmailIgnoreCase(String email);
}
