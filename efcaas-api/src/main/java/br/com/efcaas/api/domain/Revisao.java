package br.com.efcaas.api.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "revisao")
@Getter
@Setter
public class Revisao {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_parecer", nullable = false)
    private Parecer parecer;

    @Column(length = 30)
    private String status;

    @Column(columnDefinition = "TEXT")
    private String justificativa;
}
