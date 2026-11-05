package gestao_de_assinaturas.mateus.dto.response;

import gestao_de_assinaturas.mateus.enums.Plans;

import java.math.BigDecimal;

public record PlanResponse (

        Plans plan,
        BigDecimal paymentAmount


)

{



}
