package br.com.efcaas.api.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "anexos_conteudo")
@Getter
@Setter
public class AnexoConteudo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_conteudo", nullable = false)
    private ConteudoSuspeito conteudo;

    @Column(length = 50)
    private String tipo;

    @Column(name = "object_key", nullable = false, length = 500)
    private String objectKey;

    @Column(name = "nome_arquivo", length = 255)
    private String nomeArquivo;

    @Column(name = "content_type", length = 100)
    private String contentType;

    @Column(name = "tamanho_bytes")
    private Long tamanhoBytes;
}
