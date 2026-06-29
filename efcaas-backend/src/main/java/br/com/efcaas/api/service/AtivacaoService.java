package br.com.efcaas.api.service;

import br.com.efcaas.api.domain.Tenant;
import br.com.efcaas.api.domain.TokenAtivacao;
import br.com.efcaas.api.domain.Usuario;
import br.com.efcaas.api.repository.TenantRepository;
import br.com.efcaas.api.repository.TokenAtivacaoRepository;
import br.com.efcaas.api.repository.UsuarioRepository;
import br.com.efcaas.api.security.JwtUtil;
import br.com.efcaas.api.util.HashUtil;
import br.com.efcaas.api.web.dto.LoginResponse;
import br.com.efcaas.api.web.dto.UsuarioDto;
import br.com.efcaas.api.web.mapper.UsuarioMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AtivacaoService {

    private final TenantRepository tenantRepository;
    private final TokenAtivacaoRepository tokenAtivacaoRepository;
    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final UsuarioMapper usuarioMapper;

    @Transactional
    public LoginResponse ativar(String tenantSlug, String token, String senha) {
        Tenant tenant = tenantRepository.findBySlug(tenantSlug.trim())
                .orElseThrow(() -> new IllegalArgumentException("Tenant não encontrado"));

        String tokenHash = HashUtil.sha256(token.trim());
        TokenAtivacao tokenAtivacao = tokenAtivacaoRepository.findByTokenHash(tokenHash)
                .orElseThrow(() -> new IllegalArgumentException("Token inválido"));

        if (!tokenAtivacao.getTenant().getId().equals(tenant.getId())) {
            throw new IllegalArgumentException("Token inválido para este tenant");
        }
        if (tokenAtivacao.isUtilizado()) {
            throw new IllegalStateException("Token já utilizado");
        }
        if (tokenAtivacao.isExpirado()) {
            throw new IllegalStateException("Token expirado");
        }

        Usuario usuario = tokenAtivacao.getUsuario();
        usuario.setSenha(passwordEncoder.encode(senha));
        usuarioRepository.save(usuario);

        tokenAtivacao.setUtilizadoEm(OffsetDateTime.now());
        tokenAtivacaoRepository.save(tokenAtivacao);

        var permissoes = usuario.getTipoUsuario().getPermissoes().stream()
                .map(p -> p.getNome())
                .collect(Collectors.toList());
        String jwt = jwtUtil.generateToken(
                usuario.getId(),
                usuario.getEmail(),
                permissoes,
                tenant.getId(),
                tenant.getSlug(),
                false);
        UsuarioDto usuarioDto = usuarioMapper.toDto(usuario);
        return new LoginResponse(jwt, usuarioDto, tenant.getId(), tenant.getSlug(), false);
    }
}
