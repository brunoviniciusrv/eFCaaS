package br.com.efcaas.api.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "parecer")
@Getter
@Setter
public class Parecer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_checagem", nullable = false)
    private Checagem checagem;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_etiqueta")
    private Etiqueta etiqueta;

    @Column(name = "texto_parecer", columnDefinition = "TEXT")
    private String textoParecer;
}
