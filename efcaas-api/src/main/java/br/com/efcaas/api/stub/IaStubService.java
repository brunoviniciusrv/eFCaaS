package br.com.efcaas.api.stub;

import br.com.efcaas.api.domain.Checagem;
import br.com.efcaas.api.domain.ConteudoSuspeito;
import br.com.efcaas.api.web.dto.AnaliseIaDto;
import br.com.efcaas.api.web.dto.SugestaoTituloDto;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Implementação stub do serviço de IA para o MVP.
 * Retorna respostas fixas simuladas. Para integrar com o Gemini:
 * 1. Criar GeminiIaService implements IaService
 * 2. Remover @Primary desta classe
 * 3. Anotar GeminiIaService com @Primary
 */
@Service
@Primary
public class IaStubService implements IaService {

    @Override
    public String gerarRascunhoParecer(Checagem checagem) {
        String titulo = checagem.getConteudo() != null
                ? checagem.getConteudo().getTitulo()
                : "conteúdo";

        return """
                ## Análise Preliminar (Simulada)

                **Conteúdo analisado:** %s

                Com base nas informações disponíveis, o conteúdo apresenta
                indicadores que requerem verificação aprofundada.

                ### Pontos de atenção
                - Verifique a origem e data da publicação original
                - Consulte ao menos três fontes primárias independentes
                - Analise o contexto de circulação nas redes sociais

                **Recomendação:** Consulte as fontes primárias listadas
                no relatório e compare com dados oficiais antes de emitir o parecer.

                > ⚠️ Esta análise foi gerada automaticamente pelo sistema de simulação.
                > Integração com IA real será disponibilizada em versão futura.
                """.formatted(titulo);
    }

    @Override
    public String revisarParecer(String textoParecer) {
        return """
                ## Sugestões de Revisão (Simuladas)

                O texto do parecer foi analisado. Seguem sugestões gerais:

                - **Clareza:** Certifique-se de que a conclusão principal está
                  expressa no primeiro parágrafo.
                - **Evidências:** Cada afirmação deve ter pelo menos uma fonte citada.
                - **Imparcialidade:** Revise o tom para garantir neutralidade jornalística.
                - **Conclusão:** A etiqueta escolhida deve ser justificada explicitamente
                  no texto.

                > ⚠️ Sugestões geradas pelo sistema de simulação.
                > A revisão real por IA estará disponível em versão futura.
                """;
    }

    @Override
    public AnaliseIaDto analisarConteudo(ConteudoSuspeito conteudo) {
        return AnaliseIaDto.builder()
                .avaliacaoRisco("moderado")
                .textoAnalise("""
                        Análise simulada — MVP sem integração de IA real.

                        O conteúdo apresenta características que merecem atenção:
                        verificação de fonte, contexto temporal e consistência das
                        informações com dados oficiais são etapas recomendadas.
                        """)
                .simulado(true)
                .build();
    }

    @Override
    public List<SugestaoTituloDto> gerarSugestoesEditoriais(String titulo, String conteudo) {
        return List.of(
                SugestaoTituloDto.builder()
                        .titulo(titulo != null ? titulo + " — Checagem Completa" : "Checagem de Fatos: Análise Completa")
                        .excerpt("Agência eFCaaS investigou a veracidade da informação "
                                + "e apresenta os resultados com base em fontes primárias.")
                        .simulado(true)
                        .build(),
                SugestaoTituloDto.builder()
                        .titulo("Verdade ou Mito? " + (titulo != null ? titulo : "Conteúdo Viral"))
                        .excerpt("Nossa equipe de checagem realizou uma análise detalhada "
                                + "da informação que circula nas redes sociais.")
                        .simulado(true)
                        .build(),
                SugestaoTituloDto.builder()
                        .titulo("Análise eFCaaS: O que os fatos dizem?")
                        .excerpt("Com base em evidências e fontes verificadas, "
                                + "apresentamos a checagem completa deste conteúdo.")
                        .simulado(true)
                        .build()
        );
    }
}
