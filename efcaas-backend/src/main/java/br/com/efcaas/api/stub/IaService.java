package br.com.efcaas.api.stub;

import br.com.efcaas.api.domain.ConteudoSuspeito;
import br.com.efcaas.api.web.dto.AnaliseIaDto;

/**
 * Contrato do serviço de análise de conteúdo por IA (Guaia IA Hub).
 */
public interface IaService {

    AnaliseIaDto analisarConteudo(ConteudoSuspeito conteudo);
}
