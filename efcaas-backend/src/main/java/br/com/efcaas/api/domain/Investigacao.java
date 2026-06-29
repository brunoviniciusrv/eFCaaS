package br.com.efcaas.api.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "investigacao")
@Getter
@Setter
public class Investigacao {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_checagem", nullable = false, unique = true)
    private Checagem checagem;

    @Column(name = "resumo_metodologia", columnDefinition = "TEXT")
    private String resumoMetodologia;

    @Column(columnDefinition = "TEXT")
    private String perguntas; // JSON array de strings

    @Column(name = "respostas_perguntas", columnDefinition = "TEXT")
    private String respostasPerguntas; // JSON array de strings (paralelo a perguntas)

    @Column(columnDefinition = "TEXT")
    private String fontes; // JSON array de strings

    @Column(nullable = false)
    private boolean inverificavel = false;

    @Column(name = "contato_realizado")
    private Boolean contatoRealizado; // null = não respondido

    @Column(name = "resposta_autor", columnDefinition = "TEXT")
    private String respostaAutor;

    @Column(name = "justificativa_sem_contato", columnDefinition = "TEXT")
    private String justificativaSemContato;

    @Column(name = "autor_desinformacao", columnDefinition = "TEXT")
    private String autorDesinformacao;

    @Column(name = "autor_desinformacao_inverificavel", nullable = false)
    private boolean autorDesinformacaoInverificavel = false;

    @Column(name = "criado_em", nullable = false, updatable = false)
    private LocalDateTime criadoEm = LocalDateTime.now();

    @Column(name = "atualizado_em", nullable = false)
    private LocalDateTime atualizadoEm = LocalDateTime.now();
}
