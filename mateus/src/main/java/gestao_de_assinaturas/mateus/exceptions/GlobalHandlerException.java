package gestao_de_assinaturas.mateus.exceptions;

import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalHandlerException extends RuntimeException {
    public GlobalHandlerException(String message) {
        super(message);
    }
}
