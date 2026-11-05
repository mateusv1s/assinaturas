package gestao_de_assinaturas.mateus.controller;

import gestao_de_assinaturas.mateus.dto.request.SubscriptionRequest;
import gestao_de_assinaturas.mateus.dto.response.SubscriptionResponse;
import gestao_de_assinaturas.mateus.service.SubscriptionService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping ("/test/subs")
public class SubscriptionController {

    private final SubscriptionService subscriptionService;

    public SubscriptionController(SubscriptionService subscriptionService) {
        this.subscriptionService = subscriptionService;
    }

    public ResponseEntity <SubscriptionResponse> createSub (@PathVariable Long userId, @Valid @RequestBody SubscriptionRequest request) {
        return null;
    }

}
