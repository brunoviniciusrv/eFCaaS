package br.com.efcaas.api.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "usuario")
@Getter
@Setter
public class Usuario {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String nome;

    @Column(nullable = false, unique = true, length = 100)
    private String email;

    @Column(nullable = false, length = 255)
    private String senha;

    @Column(length = 255)
    private String foto;

    @Column(columnDefinition = "TEXT")
    private String bio;

    @Column(length = 1)
    private String status = "A";

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "id_tipo_usuario", nullable = false)
    private TipoUsuario tipoUsuario;

    public boolean isAtivo() {
        return "A".equals(this.status);
    }
}
