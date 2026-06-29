package br.com.efcaas.api.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "checagem")
@Getter
@Setter
public class Checagem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_conteudo", nullable = false)
    private ConteudoSuspeito conteudo;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_curador", nullable = false)
    private Usuario curador;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_checador")
    private Usuario checador;

    @Column(columnDefinition = "TEXT")
    private String briefing;

    @Column(length = 30)
    private String status = "aberta";

    @Column(name = "data_inicio")
    private LocalDateTime dataInicio;

    @Column(name = "data_conclusao")
    private LocalDateTime dataConclusao;

    @Column(name = "tenant_id")
    private Long tenantId;
}
