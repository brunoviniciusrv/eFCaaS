package br.com.efcaas.api.web;

import br.com.efcaas.api.repository.TenantRepository;
import br.com.efcaas.api.service.SolicitacaoCadastroService;
import br.com.efcaas.api.web.dto.SolicitacaoCadastroDto;
import br.com.efcaas.api.web.dto.TenantExistsResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.net.URI;
import java.util.List;

@RestController
@RequestMapping("/api/v1/public")
@RequiredArgsConstructor
@Tag(name = "Público", description = "Endpoints públicos de cadastro e verificação de tenants")
public class PublicRegistrationController {

    private final SolicitacaoCadastroService solicitacaoCadastroService;
    private final TenantRepository tenantRepository;

    @PostMapping("/solicitacoes-cadastro")
    @Operation(summary = "Enviar solicitação de cadastro de agência")
    public ResponseEntity<SolicitacaoCadastroDto> criarSolicitacao(
            @RequestParam String nomeAgencia,
            @RequestParam(required = false) String cnpj,
            @RequestParam String nomeResponsavel,
            @RequestParam String emailContato,
            @RequestParam String senha,
            @RequestParam(required = false) String telefone,
            @RequestParam(required = false) String pais,
            @RequestParam(required = false) String estado,
            @RequestParam(required = false) String cidade,
            @RequestParam(required = false) String planoSolicitado,
            @RequestParam(required = false) String informacoesExtras,
            @RequestParam(required = false) List<MultipartFile> documentos) {
        SolicitacaoCadastroDto created = solicitacaoCadastroService.criar(
                nomeAgencia,
                cnpj,
                nomeResponsavel,
                emailContato,
                senha,
                telefone,
                pais,
                estado,
                cidade,
                planoSolicitado,
                informacoesExtras,
                documentos);

        URI location = ServletUriComponentsBuilder.fromCurrentRequest()
                .path("/{id}")
                .buildAndExpand(created.id())
                .toUri();
        return ResponseEntity.created(location).body(created);
    }

    @GetMapping("/tenants/{slug}/exists")
    @Operation(summary = "Verificar se um slug de tenant já existe")
    public ResponseEntity<TenantExistsResponse> tenantExists(@PathVariable String slug) {
        return ResponseEntity.ok(new TenantExistsResponse(tenantRepository.existsBySlug(slug)));
    }
}
