package br.com.efcaas.api.web;

import br.com.efcaas.api.service.AtivacaoService;
import br.com.efcaas.api.web.dto.AtivacaoRequest;
import br.com.efcaas.api.web.dto.LoginResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/public")
@RequiredArgsConstructor
@Tag(name = "Público", description = "Ativação de conta de agência")
public class PublicActivationController {

    private final AtivacaoService ativacaoService;

    @PostMapping("/ativacao")
    @Operation(summary = "Ativar conta com token e definir senha")
    public ResponseEntity<LoginResponse> ativar(@Valid @RequestBody AtivacaoRequest request) {
        return ResponseEntity.ok(ativacaoService.ativar(request.tenant(), request.token(), request.senha()));
    }
}
