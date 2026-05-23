package br.com.efcaas.api.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "analise_externa")
@Getter
@Setter
public class AnaliseExterna {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_checagem", nullable = false)
    private Checagem checagem;

    @Column(length = 50)
    private String veredito;

    @Column(columnDefinition = "TEXT")
    private String parecer;

    @Column(name = "data_analise")
    private LocalDateTime dataAnalise = LocalDateTime.now();
}
