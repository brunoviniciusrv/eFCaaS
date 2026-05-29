package br.com.efcaas.api.web.dto;

public record ConteudoSuspeitoDto(
        String id,
        String titulo,
        String alegacao,
        String link,
        String fonte,
        String descricao,
        String dataEntrada,
        String status,
        String prioridade,
        ChecagemDto checagem,
        AnaliseIaDto analiseIa
) {}
