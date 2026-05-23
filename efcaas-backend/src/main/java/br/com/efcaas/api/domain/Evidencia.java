package br.com.efcaas.api.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "evidencia")
@Getter
@Setter
public class Evidencia {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_checagem", nullable = false)
    private Checagem checagem;

    @Column(length = 50)
    private String tipo;

    @Column(name = "link_arquivo", length = 255)
    private String linkArquivo;

    @Column(columnDefinition = "TEXT")
    private String descricao;
}
