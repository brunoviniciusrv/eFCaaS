package br.com.efcaas.api.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "solicitacao_cadastro_agencia")
@Getter
@Setter
public class SolicitacaoCadastroAgencia {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "nome_agencia", nullable = false, length = 150)
    private String nomeAgencia;

    @Column(length = 20)
    private String cnpj;

    @Column(name = "nome_responsavel", nullable = false, length = 150)
    private String nomeResponsavel;

    @Column(name = "email_contato", nullable = false, length = 100)
    private String emailContato;

    @Column(name = "senha_hash", length = 255)
    private String senhaHash;

    @Column(length = 30)
    private String telefone;

    @Column(nullable = false, length = 80)
    private String pais = "Brasil";

    @Column(length = 80)
    private String estado;

    @Column(length = 80)
    private String cidade;

    @Column(name = "plano_solicitado", nullable = false, length = 20)
    private String planoSolicitado = "FREE";

    @Column(name = "informacoes_extras", columnDefinition = "TEXT")
    private String informacoesExtras;

    @Column(nullable = false, length = 20)
    private String status = "PENDING";

    @Column(name = "motivo_reprovacao", columnDefinition = "TEXT")
    private String motivoReprovacao;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tenant_id")
    private Tenant tenant;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "aprovado_por_id")
    private Usuario aprovadoPor;

    @Column(name = "criado_em", nullable = false)
    private OffsetDateTime criadoEm = OffsetDateTime.now();

    @Column(name = "atualizado_em", nullable = false)
    private OffsetDateTime atualizadoEm = OffsetDateTime.now();

    @OneToMany(mappedBy = "solicitacao", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<DocumentoSolicitacao> documentos = new ArrayList<>();
}
