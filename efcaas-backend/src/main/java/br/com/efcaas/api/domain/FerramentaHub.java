package br.com.efcaas.api.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "ferramenta_hub")
@Getter
@Setter
public class FerramentaHub {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String nome;

    @Column(length = 100)
    private String categoria;

    @Column(name = "url_acesso", length = 255)
    private String urlAcesso;

    @Column(name = "credenciais_api", columnDefinition = "TEXT")
    private String credenciaisApi;

    @Column(length = 1)
    private String status = "A";
}
