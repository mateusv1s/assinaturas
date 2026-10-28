package gestao_de_assinaturas.mateus.repository;

import gestao_de_assinaturas.mateus.entity.Payment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PaymentRepository extends JpaRepository <Payment, Long> {
}
