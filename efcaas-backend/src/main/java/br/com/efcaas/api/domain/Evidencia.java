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

    /** URL externa (tipo=link) ou null quando o arquivo está no object storage. */
    @Column(name = "link_arquivo", columnDefinition = "TEXT")
    private String linkArquivo;

    @Column(name = "object_key", length = 500)
    private String objectKey;

    @Column(name = "nome_arquivo", length = 255)
    private String nomeArquivo;

    @Column(name = "content_type", length = 100)
    private String contentType;

    @Column(name = "tamanho_bytes")
    private Long tamanhoBytes;

    @Column(columnDefinition = "TEXT")
    private String descricao;
}
