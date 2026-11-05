package gestao_de_assinaturas.mateus.service;

import gestao_de_assinaturas.mateus.dto.request.SubscriptionRequest;
import gestao_de_assinaturas.mateus.dto.response.SubscriptionResponse;
import gestao_de_assinaturas.mateus.entity.Subscription;
import gestao_de_assinaturas.mateus.enums.SubscriptionStatus;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

@Service
public class SubscriptionService {


    @Transactional
    public SubscriptionResponse createSubscription (Long userId, SubscriptionRequest request) {
        Subscription sub = new Subscription();
        sub.setUserId(userId);
        sub.setStatus(SubscriptionStatus.ACTIVE);
        sub.setPlans(request.plan());



        return null;

    }


}
