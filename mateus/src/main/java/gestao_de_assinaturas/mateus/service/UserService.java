package gestao_de_assinaturas.mateus.service;

import gestao_de_assinaturas.mateus.dto.request.UserRequest;
import gestao_de_assinaturas.mateus.dto.response.UserResponse;
import gestao_de_assinaturas.mateus.entity.User;
import gestao_de_assinaturas.mateus.enums.PaymentStatus;
import gestao_de_assinaturas.mateus.enums.UserRole;
import gestao_de_assinaturas.mateus.exceptions.EmailAlreadyExistsException;
import gestao_de_assinaturas.mateus.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import jakarta.transaction.Transactional;
import jakarta.validation.constraints.Email;
import org.springframework.stereotype.Service;

@Service
public class UserService {

    private final UserRepository userRepository;

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Transactional
    public UserResponse createUser (UserRequest request) {
        if (userRepository.existsByEmailIgnoreCase(request.email())) {
            throw new EmailAlreadyExistsException("Email already registred!");
        }

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
