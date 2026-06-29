package br.com.efcaas.api.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "conteudo_recebido")
@Getter
@Setter
public class ConteudoRecebido {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 500)
    private String titulo;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String conteudo;

    @Column(columnDefinition = "TEXT")
    private String resumo;

    @Column(name = "tipo_fonte", nullable = false, length = 50)
    private String tipoFonte;

    @Column(name = "nome_remetente", length = 255)
    private String nomeRemetente;

    @Column(name = "endereco_remetente", length = 255)
    private String enderecoRemetente;

    @Column(name = "link_original", length = 1024)
    private String linkOriginal;

    @Column(name = "id_mensagem_externa", length = 255)
    private String idMensagemExterna;

    @Column(name = "notas_internas", columnDefinition = "TEXT")
    private String notasInternas;

    @Column(nullable = false, length = 30)
    private String status = "received";

    @Column(name = "recebido_em", nullable = false)
    private OffsetDateTime recebidoEm = OffsetDateTime.now();

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_conteudo_triagem")
    private ConteudoSuspeito conteudoTriagem;

    @OneToMany(mappedBy = "conteudoRecebido", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ConteudoRecebidoMidia> midias = new ArrayList<>();

    @Column(name = "tenant_id")
    private Long tenantId;
}
