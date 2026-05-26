package br.com.efcaas.api.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "auditoria")
@Getter
@Setter
@NoArgsConstructor
public class Auditoria {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_usuario")
    private Usuario usuario;

    @Column(nullable = false, length = 100)
    private String acao;

    @Column(length = 255)
    private String alvo;

    @Column(columnDefinition = "TEXT")
    private String detalhes;

    @Column(nullable = false)
    private LocalDateTime timestamp = LocalDateTime.now();

    public Auditoria(Usuario usuario, String acao, String alvo, String detalhes) {
        this.usuario = usuario;
        this.acao = acao;
        this.alvo = alvo;
        this.detalhes = detalhes;
    }
}
