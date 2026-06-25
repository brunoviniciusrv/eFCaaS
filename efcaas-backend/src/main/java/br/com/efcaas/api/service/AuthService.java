package br.com.efcaas.api.service;

import br.com.efcaas.api.domain.Usuario;
import br.com.efcaas.api.repository.UsuarioRepository;
import br.com.efcaas.api.security.JwtUtil;
import br.com.efcaas.api.web.dto.LoginRequest;
import br.com.efcaas.api.web.dto.LoginResponse;
import br.com.efcaas.api.web.dto.UsuarioDto;
import br.com.efcaas.api.web.mapper.UsuarioMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final UsuarioRepository usuarioRepository;
    private final JwtUtil jwtUtil;
    private final UsuarioMapper usuarioMapper;
    private final PasswordEncoder passwordEncoder;

    @Transactional(readOnly = true)
    public LoginResponse login(LoginRequest request) {
        Authentication auth = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.email(), request.senha())
        );

        Usuario usuario = usuarioRepository.findByEmail(request.email())
                .orElseThrow(() -> new IllegalStateException("Usuário não encontrado após autenticação"));

        List<String> permissoes = usuario.getTipoUsuario()
                .getPermissoes()
                .stream()
                .map(p -> p.getNome())
                .collect(Collectors.toList());

        String token = jwtUtil.generateToken(usuario.getId(), usuario.getEmail(), permissoes);
        UsuarioDto usuarioDto = usuarioMapper.toDto(usuario);

        return new LoginResponse(token, usuarioDto);
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
