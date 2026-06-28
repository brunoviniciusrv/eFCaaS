package br.com.efcaas.api.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "relatorio_publicacao")
@Getter
@Setter
public class RelatorioPublicacao {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_parecer", nullable = false)
    private Parecer parecer;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_editor", nullable = false)
    private Usuario editor;

    @Column(length = 255)
    private String titulo;

    @Column(name = "corpo_texto", columnDefinition = "TEXT")
    private String corpoTexto;

    @Column(name = "status_publicacao", length = 30)
    private String statusPublicacao = "draft";

    @Column(length = 30)
    private String template = "complete";

    @Column(columnDefinition = "TEXT")
    private String resumo;

    @Column(name = "comentarios_json", columnDefinition = "TEXT")
    private String comentariosJson;

    @Column(name = "data_criacao")
    private LocalDateTime dataCriacao = LocalDateTime.now();

    @Column(name = "data_atualizacao")
    private LocalDateTime dataAtualizacao = LocalDateTime.now();

    @Column(name = "data_publicacao")
    private LocalDateTime dataPublicacao;

    @Column(name = "tenant_id")
    private Long tenantId;
}
