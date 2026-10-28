package gestao_de_assinaturas.mateus.dto.response;

import gestao_de_assinaturas.mateus.entity.User;
import gestao_de_assinaturas.mateus.enums.UserRole;

public record UserResponse (

        Long id,
        String name,
        String email,
        UserRole role


)

{

    public static UserResponse toResponse (User user) {
        return new UserResponse (
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getRole()
        );
    }

}
