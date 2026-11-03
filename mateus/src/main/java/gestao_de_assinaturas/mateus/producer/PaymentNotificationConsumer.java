package gestao_de_assinaturas.mateus.producer;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

@Component
@Slf4j
public class PaymentNotificationConsumer implements PaymentNotificationInterface {


    @Override
    public void mensage(String message) {

    }
}
