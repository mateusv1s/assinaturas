package gestao_de_assinaturas.mateus.dto.response;

import gestao_de_assinaturas.mateus.entity.User;

public record AuthResponse (

        String token,
        UserResponse user

)

{





}
