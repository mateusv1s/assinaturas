package gestao_de_assinaturas.mateus.config;



import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.support.converter.JacksonJsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import tools.jackson.databind.ObjectMapper;
import tools.jackson.databind.json.JsonMapper;

@Configuration
public class RabbitMQConfig {

    @Bean
    public RabbitTemplate rabbitTemplate (ConnectionFactory connectionFactory, MessageConverter messageConverter) {
        RabbitTemplate temp = new RabbitTemplate(connectionFactory);
        temp.setMessageConverter(messageConverter);
        return temp;
    }

    @Bean
    public MessageConverter messageConverter (ObjectMapper mapper) {
        return new JacksonJsonMessageConverter((JsonMapper) mapper);
    }

}
