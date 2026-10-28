package gestao_de_assinaturas.mateus.service;

import io.jsonwebtoken.Jwts;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.sql.Date;
import java.time.Duration;
import java.time.Instant;

@Service
public class JwtService {

    private final SecretKey key;
    private final Duration expirationTimer;

    public JwtService(SecretKey key, Duration expirationTimer) {
        this.key = key;
        this.expirationTimer = expirationTimer;
    }

    public String generateToken (Long id, String email, String role) {

        return Jwts.builder()
                .setIssuer("teste")
                .setSubject(id.toString())
                .claim("email", email)
                .setIssuedAt(Date.from(Instant.now()))
                .setExpiration(Date.from(Instant.now()))
                .signWith(key)
                .compact();


    }

}
