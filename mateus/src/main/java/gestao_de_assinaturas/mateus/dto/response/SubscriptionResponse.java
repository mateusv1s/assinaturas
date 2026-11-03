package gestao_de_assinaturas.mateus.dto.response;

import gestao_de_assinaturas.mateus.enums.Plans;
import gestao_de_assinaturas.mateus.enums.SubscriptionStatus;

import java.time.LocalDate;

public record SubscriptionResponse (

        Long idSubscription,
        Long userId,
        SubscriptionStatus status,
        Plans plan,
        LocalDate startSubscription,
        LocalDate endSubscription


)

{



}
