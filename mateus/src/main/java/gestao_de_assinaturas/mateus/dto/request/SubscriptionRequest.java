package gestao_de_assinaturas.mateus.dto.request;

import gestao_de_assinaturas.mateus.enums.Plans;

import java.time.LocalDate;

public record SubscriptionRequest (

        Plans plan,
        LocalDate startSubscription


)

{



}
