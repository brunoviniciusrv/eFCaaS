package br.com.efcaas.api.service;

import br.com.efcaas.api.domain.Tenant;
import br.com.efcaas.api.domain.TipoUsuario;
import br.com.efcaas.api.domain.Usuario;
import br.com.efcaas.api.repository.TenantRepository;
import br.com.efcaas.api.repository.TipoUsuarioRepository;
import br.com.efcaas.api.repository.UsuarioRepository;
import br.com.efcaas.api.tenant.TenantScope;
import br.com.efcaas.api.web.dto.CriarUsuarioRequest;
import br.com.efcaas.api.web.dto.UsuarioDto;
import br.com.efcaas.api.web.mapper.UsuarioMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UsuarioService {

    private static final String DEFAULT_PASSWORD = "Admin@2026!";

    private final UsuarioRepository usuarioRepository;
    private final TipoUsuarioRepository tipoUsuarioRepository;
    private final TenantRepository tenantRepository;
    private final UsuarioMapper usuarioMapper;
    private final PasswordEncoder passwordEncoder;
    private final TenantScope tenantScope;

    @Transactional(readOnly = true)
    public List<UsuarioDto> listarAtivos() {
        Long tenantId = tenantScope.requireTenantId();
        return usuarioRepository.findByTenant_IdAndStatus(tenantId, "A").stream()
                .map(usuarioMapper::toDto)
                .toList();
    }

    @Transactional
    public UsuarioDto criar(CriarUsuarioRequest request) {
        Long tenantId = tenantScope.requireTenantId();
        String email = request.email().trim().toLowerCase();

        if (usuarioRepository.existsByEmailAndTenant_Id(email, tenantId)) {
            throw new IllegalStateException("Já existe um usuário com este e-mail nesta agência");
        }

        TipoUsuario tipoUsuario = tipoUsuarioRepository.findByNome(request.perfil().trim())
                .orElseThrow(() -> new IllegalArgumentException(
                        "Perfil de acesso inválido: " + request.perfil()));

        Tenant tenant = tenantRepository.findById(tenantId)
                .orElseThrow(() -> new IllegalArgumentException("Tenant não encontrado: " + tenantId));

        String senhaPlana = (request.senha() != null && !request.senha().isBlank())
                ? request.senha()
                : DEFAULT_PASSWORD;

        Usuario usuario = new Usuario();
        usuario.setNome(request.nome().trim());
        usuario.setEmail(email);
        usuario.setSenha(passwordEncoder.encode(senhaPlana));
        usuario.setStatus("A");
        usuario.setTipoUsuario(tipoUsuario);
        usuario.setTenant(tenant);

        return usuarioMapper.toDto(usuarioRepository.save(usuario));
    }
}
