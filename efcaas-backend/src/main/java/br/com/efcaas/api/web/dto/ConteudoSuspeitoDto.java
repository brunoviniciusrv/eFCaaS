package br.com.efcaas.api.web.dto;

import java.util.List;

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
        AnaliseIaDto analiseIa,
        List<AnexoConteudoDto> anexos
) {}
