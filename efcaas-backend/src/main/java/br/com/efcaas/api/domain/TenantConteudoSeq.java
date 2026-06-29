package br.com.efcaas.api.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "tenant_conteudo_seq")
@Getter
@Setter
public class TenantConteudoSeq {

    @Id
    @Column(name = "tenant_id")
    private Long tenantId;

    @Column(name = "ultimo_numero", nullable = false)
    private Integer ultimoNumero = 0;
}
