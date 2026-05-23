package br.com.efcaas.api.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "analise_ia")
@Getter
@Setter
public class AnaliseIa {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_conteudo", nullable = false)
    private ConteudoSuspeito conteudo;

    @Column(name = "avaliacao_risco", length = 50)
    private String avaliacaoRisco;

    @Column(name = "texto_analise", columnDefinition = "TEXT")
    private String textoAnalise;
}
