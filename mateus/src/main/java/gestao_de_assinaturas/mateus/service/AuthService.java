package gestao_de_assinaturas.mateus.service;

import gestao_de_assinaturas.mateus.dto.request.LoginRequest;
import gestao_de_assinaturas.mateus.dto.request.RegisterRequest;
import gestao_de_assinaturas.mateus.dto.response.AuthResponse;
import gestao_de_assinaturas.mateus.entity.User;
import gestao_de_assinaturas.mateus.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }


    public AuthResponse register (RegisterRequest request) {

        User user = new User();
        user.setName(request.name());
        user.setEmail(request.email());
        user.setPassword(passwordEncoder.encode(request.password()));

        return null;

    }

    public AuthResponse login (LoginRequest request) {
        return null;
    }



}
