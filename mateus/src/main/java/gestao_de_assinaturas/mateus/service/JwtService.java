
package gestao_de_assinaturas.mateus.service;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.Date;

@Service
public class JwtService {

    private static final Logger log =
            LoggerFactory.getLogger(JwtService.class);

    private final SecretKey key;
    private final Duration expiration;

    public JwtService(
            @Value("${JWT_SECRET:}") String secret,
            @Value("${app.security.jwt.expiration:PT8H}")
            Duration expiration
    ) {

        byte[] bytes;

        if (secret == null || secret.isBlank()) {

            // Chave temporária para desenvolvimento local
            bytes = new byte[32];
            new SecureRandom().nextBytes(bytes);

            log.warn(
                    "JWT_SECRET não configurado. " +
                            "Usando chave temporária: tokens serão " +
                            "invalidados ao reiniciar a aplicação."
            );

        } else {

            bytes = secret.getBytes(StandardCharsets.UTF_8);

            if (bytes.length < 32) {
                throw new IllegalStateException(
                        "JWT_SECRET deve ter pelo menos 32 bytes"
                );
            }
        }

        if (expiration.isZero() || expiration.isNegative()) {
            throw new IllegalArgumentException(
                    "A expiração do JWT deve ser positiva"
            );
        }

        this.key = Keys.hmacShaKeyFor(bytes);
        this.expiration = expiration;
    }

    // ==============================
    // GERAR TOKEN
    // ==============================
    public String createToken(
            Long userId,
            String email,
            String role
    ) {

        Instant now = Instant.now();

        return Jwts.builder()
                .claim("email", email)
                .claim("role", role)
                .signWith(key)
                .compact();
    }

    // ==============================
    // EXTRAIR CLAIMS
    // ==============================
    public Claims extractClaims(String token) {

        return null;
    }

    // ==============================
    // EXTRAIR ID DO USUÁRIO
    // ==============================
    public Long extractUserId(String token) {

        String userId = extractClaims(token).getSubject();

        return Long.valueOf(userId);
    }

    // ==============================
    // VALIDAR TOKEN
    // ==============================
    public boolean isTokenValid(String token) {

        try {
            extractClaims(token);
            return true;

        } catch (io.jsonwebtoken.JwtException |
                 IllegalArgumentException exception) {

            return false;
        }
    }
}
