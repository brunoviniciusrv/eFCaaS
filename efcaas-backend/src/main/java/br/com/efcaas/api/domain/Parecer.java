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

    @Column(columnDefinition = "TEXT")
    private String resumo;

    @Column(columnDefinition = "TEXT")
    private String fontes;

    @Column(name = "resposta_autor", columnDefinition = "TEXT")
    private String respostaAutor;

    @Column(name = "texto_parecer", columnDefinition = "TEXT")
    private String textoParecer;

    @Column(columnDefinition = "TEXT")
    private String perguntas;

    @Column(nullable = false)
    private boolean inverificavel = false;

    @Column(name = "contato_autor", columnDefinition = "TEXT")
    private String contatoAutor;
}
