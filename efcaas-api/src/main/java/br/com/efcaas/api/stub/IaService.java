package br.com.efcaas.api.stub;

import br.com.efcaas.api.domain.Checagem;
import br.com.efcaas.api.domain.ConteudoSuspeito;
import br.com.efcaas.api.web.dto.AnaliseIaDto;
import br.com.efcaas.api.web.dto.SugestaoTituloDto;

import java.util.List;

/**
 * Contrato do serviço de IA. No MVP é implementado por {@link IaStubService}.
 * Quando integrar o Gemini: criar GeminiIaService implements IaService,
 * remover @Primary de IaStubService e anotar a nova impl com @Primary.
 */
public interface IaService {

    String gerarRascunhoParecer(Checagem checagem);

    String revisarParecer(String textoParecer);

    AnaliseIaDto analisarConteudo(ConteudoSuspeito conteudo);

    List<SugestaoTituloDto> gerarSugestoesEditoriais(String titulo, String conteudo);
}
