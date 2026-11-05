package gestao_de_assinaturas.mateus.config;



import org.springframework.amqp.core.*;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.support.converter.JacksonJsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.beans.factory.annotation.Value;
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

    @Bean
    public Declarables paymentsDeclarables (@Value("") String exchangeName, @Value("") String queueName, @Value("${}") String routingKey) {
        DirectExchange exchange = new DirectExchange(exchangeName, true, false);
        Queue queue = QueueBuilder.durable(queueName).build();
        Binding binding = BindingBuilder.bind(queue).to(exchange).with(routingKey);
        return new Declarables(exchange, queue, binding);
    }

}
