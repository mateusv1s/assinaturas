package gestao_de_assinaturas.mateus.controller;

import gestao_de_assinaturas.mateus.dto.request.LoginRequest;
import gestao_de_assinaturas.mateus.dto.request.RegisterRequest;
import gestao_de_assinaturas.mateus.dto.response.AuthResponse;
import gestao_de_assinaturas.mateus.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping ("/auth/test")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping ("/register")
    public ResponseEntity <AuthResponse> register (@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(authService.register(request));
    }

    @PostMapping ("/login")
    public ResponseEntity <AuthResponse> login (@Valid LoginRequest request) {
        return ResponseEntity.status(HttpStatus.ACCEPTED).body(authService.login(request));
    }

}
