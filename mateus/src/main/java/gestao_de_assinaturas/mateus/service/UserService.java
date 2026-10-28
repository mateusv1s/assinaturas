package gestao_de_assinaturas.mateus.service;

import gestao_de_assinaturas.mateus.dto.request.UserRequest;
import gestao_de_assinaturas.mateus.dto.response.UserResponse;
import gestao_de_assinaturas.mateus.entity.User;
import gestao_de_assinaturas.mateus.enums.UserRole;
import gestao_de_assinaturas.mateus.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

@Service
public class UserService {

    private final UserRepository userRepository;

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Transactional
    public UserResponse createUser (UserRequest request) {

        User user = new User();
        user.setName(request.name());
        user.setEmail(request.email());
        user.setRole(UserRole.USER);
        user = userRepository.save(user);

        return UserResponse.toResponse(user);

    }

    public UserResponse getAll (Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("acabar dps"));

        return UserResponse.toResponse(user);
    }




}
