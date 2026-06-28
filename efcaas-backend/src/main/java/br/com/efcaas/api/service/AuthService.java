package br.com.efcaas.api.service;

import br.com.efcaas.api.domain.Tenant;
import br.com.efcaas.api.domain.Usuario;
import br.com.efcaas.api.repository.TenantRepository;
import br.com.efcaas.api.repository.UsuarioRepository;
import br.com.efcaas.api.security.JwtUtil;
import br.com.efcaas.api.web.dto.LoginRequest;
import br.com.efcaas.api.web.dto.LoginResponse;
import br.com.efcaas.api.web.dto.UsuarioDto;
import br.com.efcaas.api.web.mapper.UsuarioMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UsuarioRepository usuarioRepository;
    private final TenantRepository tenantRepository;
    private final JwtUtil jwtUtil;
    private final UsuarioMapper usuarioMapper;
    private final PasswordEncoder passwordEncoder;

    @Transactional(readOnly = true)
    public LoginResponse login(LoginRequest request) {
        String email = request.email().trim().toLowerCase();
        String tenantSlugParam = request.tenantSlug();

        Usuario usuario = resolveUsuario(email, tenantSlugParam, request.senha());

        if (!usuario.isAtivo()) {
            throw new DisabledException("Usuário suspenso");
        }

        Long tenantId = usuario.getTenant() != null ? usuario.getTenant().getId() : null;
        String tenantSlug = usuario.getTenant() != null ? usuario.getTenant().getSlug() : null;
        boolean platformAdmin = usuario.getTenant() == null;

        List<String> permissoes = usuario.getTipoUsuario()
                .getPermissoes()
                .stream()
                .map(p -> p.getNome())
                .collect(Collectors.toList());

        String token = jwtUtil.generateToken(
                usuario.getId(), usuario.getEmail(), permissoes, tenantId, tenantSlug, platformAdmin);
        UsuarioDto usuarioDto = usuarioMapper.toDto(usuario);

        return new LoginResponse(token, usuarioDto, tenantId, tenantSlug, platformAdmin);
    }

    private Usuario resolveUsuario(String email, String tenantSlugParam, String senha) {
        if (tenantSlugParam != null && !tenantSlugParam.isBlank()) {
            Tenant tenant = tenantRepository.findBySlug(tenantSlugParam.trim())
                    .orElseThrow(() -> new BadCredentialsException("Tenant não encontrado"));
            Usuario usuario = usuarioRepository.findByEmailAndTenant_Id(email, tenant.getId())
                    .orElseThrow(() -> new BadCredentialsException("Credenciais inválidas"));
            assertPassword(senha, usuario);
            return usuario;
        }

        List<Usuario> matches = new ArrayList<>();
        usuarioRepository.findByEmailAndTenantIsNull(email).ifPresent(u -> {
            if (passwordEncoder.matches(senha, u.getSenha())) {
                matches.add(u);
            }
        });
        for (Usuario tenantUser : usuarioRepository.findTenantUsersByEmail(email)) {
            if (passwordEncoder.matches(senha, tenantUser.getSenha())) {
                matches.add(tenantUser);
            }
        }

        if (matches.isEmpty()) {
            throw new BadCredentialsException("Credenciais inválidas");
        }
        if (matches.size() > 1) {
            throw new BadCredentialsException(
                    "Este e-mail está associado a mais de uma conta. Entre em contato com o suporte eFCaaS.");
        }
        return matches.get(0);
    }

    private void assertPassword(String senha, Usuario usuario) {
        if (!passwordEncoder.matches(senha, usuario.getSenha())) {
            throw new BadCredentialsException("Credenciais inválidas");
        }
    }

    @Transactional(readOnly = true)
    public UsuarioDto getUsuarioLogado(Long userId) {
        Usuario usuario = usuarioRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Usuário não encontrado: " + userId));
        return usuarioMapper.toDto(usuario);
    }

    @Transactional
    public UsuarioDto atualizarPerfil(Long userId, String nome, String bio, String foto) {
        Usuario usuario = usuarioRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Usuário não encontrado: " + userId));

        if (nome != null && !nome.isBlank()) {
            usuario.setNome(nome.trim());
        }
        if (bio != null) {
            usuario.setBio(bio.isBlank() ? null : bio.trim());
        }
        if (foto != null && !foto.isBlank()) {
            usuario.setFoto(foto);
        }

        return usuarioMapper.toDto(usuarioRepository.save(usuario));
    }

    @Transactional
    public UsuarioDto alterarEmail(Long userId, String novoEmail, String senhaAtual) {
        Usuario usuario = usuarioRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Usuário não encontrado: " + userId));

        if (!passwordEncoder.matches(senhaAtual, usuario.getSenha())) {
            throw new IllegalArgumentException("Senha atual incorreta");
        }

        String emailNormalizado = novoEmail.trim().toLowerCase();
        usuarioRepository.findByEmail(emailNormalizado).ifPresent(existing -> {
            if (!existing.getId().equals(userId)) {
                throw new IllegalStateException("Já existe um usuário com este e-mail");
            }
        });

        usuario.setEmail(emailNormalizado);
        return usuarioMapper.toDto(usuarioRepository.save(usuario));
    }

    @Transactional
    public void alterarSenha(Long userId, String senhaAtual, String novaSenha) {
        Usuario usuario = usuarioRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Usuário não encontrado: " + userId));

        if (!passwordEncoder.matches(senhaAtual, usuario.getSenha())) {
            throw new IllegalArgumentException("Senha atual incorreta");
        }

        usuario.setSenha(passwordEncoder.encode(novaSenha));
        usuarioRepository.save(usuario);
    }
}
