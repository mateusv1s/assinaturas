package gestao_de_assinaturas.mateus.repository;

import gestao_de_assinaturas.mateus.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface UserRepository extends JpaRepository <User, Long> {



}
