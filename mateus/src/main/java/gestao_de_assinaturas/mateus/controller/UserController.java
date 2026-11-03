package gestao_de_assinaturas.mateus.controller;

import gestao_de_assinaturas.mateus.dto.request.UserRequest;
import gestao_de_assinaturas.mateus.dto.response.UserResponse;
import gestao_de_assinaturas.mateus.service.UserService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping ("/api/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @PostMapping
    public ResponseEntity <UserResponse> createUser (@Valid @RequestBody UserRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(userService.createUser(request));
    }

    @GetMapping
    public UserResponse getAll (@PathVariable Long userID) {
        return userService.getAll(userID);
    }


}
