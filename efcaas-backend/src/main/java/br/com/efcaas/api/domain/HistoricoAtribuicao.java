package br.com.efcaas.api.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "historico_atribuicao")
@Getter
@Setter
@NoArgsConstructor
public class HistoricoAtribuicao {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_checagem", nullable = false)
    private Checagem checagem;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_usuario", nullable = false)
    private Usuario usuario;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_atribuido_por")
    private Usuario atribuidoPor;

    @Column(nullable = false, length = 50)
    private String acao;

    @Column(columnDefinition = "TEXT")
    private String motivo;

    @Column(nullable = false)
    private LocalDateTime timestamp = LocalDateTime.now();

    public HistoricoAtribuicao(Checagem checagem, Usuario usuario, Usuario atribuidoPor, String acao, String motivo) {
        this.checagem = checagem;
        this.usuario = usuario;
        this.atribuidoPor = atribuidoPor;
        this.acao = acao;
        this.motivo = motivo;
    }
}
