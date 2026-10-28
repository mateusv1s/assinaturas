package gestao_de_assinaturas.mateus.exceptions;

import org.springframework.http.HttpStatus;

public class NotFoundException extends RuntimeException {
    public NotFoundException(String message, String error) {
        super();
    }
}
