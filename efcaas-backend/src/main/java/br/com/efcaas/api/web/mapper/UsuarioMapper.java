package br.com.efcaas.api.web.mapper;

import br.com.efcaas.api.domain.Usuario;
import br.com.efcaas.api.web.dto.TipoUsuarioDto;
import br.com.efcaas.api.web.dto.UsuarioDto;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.stream.Collectors;

@Component
public class UsuarioMapper {

    public UsuarioDto toDto(Usuario usuario) {
        List<String> permissoes = usuario.getTipoUsuario()
                .getPermissoes()
                .stream()
                .map(p -> p.getNome())
                .sorted()
                .collect(Collectors.toList());

        String statusFront = "A".equals(usuario.getStatus()) ? "active" : "suspended";

        TipoUsuarioDto tipoDto = new TipoUsuarioDto(
                String.valueOf(usuario.getTipoUsuario().getId()),
                usuario.getTipoUsuario().getNome()
        );

        return new UsuarioDto(
                String.valueOf(usuario.getId()),
                usuario.getNome(),
                usuario.getEmail(),
                statusFront,
                usuario.getFoto(),
                usuario.getBio(),
                tipoDto,
                permissoes
        );
    }
}
