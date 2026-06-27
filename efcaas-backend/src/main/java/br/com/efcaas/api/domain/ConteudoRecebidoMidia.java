package br.com.efcaas.api.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "conteudo_recebido_midia")
@Getter
@Setter
public class ConteudoRecebidoMidia {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_conteudo_recebido", nullable = false)
    private ConteudoRecebido conteudoRecebido;

    @Column(nullable = false, length = 30)
    private String tipo;

    @Column(nullable = false, length = 2048)
    private String url;

    @Column(length = 255)
    private String titulo;
}
