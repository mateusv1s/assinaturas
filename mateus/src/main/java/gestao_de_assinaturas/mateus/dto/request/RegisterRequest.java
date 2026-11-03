package gestao_de_assinaturas.mateus.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RegisterRequest (

        @NotBlank
        @Size (max = 100)
        String name,

        @Email
        @NotBlank
        @Size (max = 255)
        String email,

        @NotBlank
        @Size (min = 8, max = 20)
        String password


) {
}
