package br.com.efcaas.api.service;

import br.com.efcaas.api.domain.Checagem;
import br.com.efcaas.api.domain.ConteudoSuspeito;
import br.com.efcaas.api.repository.ChecagemRepository;
import br.com.efcaas.api.repository.ConteudoSuspeitoRepository;
import br.com.efcaas.api.web.dto.ConteudoSuspeitoDto;
import br.com.efcaas.api.web.dto.DashboardResumoDto;
import br.com.efcaas.api.web.mapper.ConteudoSuspeitoMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final ConteudoSuspeitoRepository conteudoRepo;
    private final ChecagemRepository checagemRepo;
    private final ConteudoSuspeitoMapper mapper;

    @Transactional(readOnly = true)
    public DashboardResumoDto obterResumo(Long usuarioId) {
        long pendentes    = conteudoRepo.countByStatus("pending");
        long emAnalise    = conteudoRepo.countByStatus("in_progress");
        long concluidos   = conteudoRepo.countByStatus("completed");
        long retificacao  = conteudoRepo.countByStatus("to_rectify");
        long revisaoFinal = conteudoRepo.countByStatus("final_review");
        long total        = conteudoRepo.count();

        List<ConteudoSuspeitoDto> minhaFila = checagemRepo.findByChecadorId(usuarioId).stream()
                .filter(ch -> {
                    ConteudoSuspeito c = ch.getConteudo();
                    return !"completed".equals(c.getStatus());
                })
                .map(ch -> mapper.toDtoSimples(ch.getConteudo(), ch))
                .toList();

        return new DashboardResumoDto(
                pendentes, emAnalise, concluidos, retificacao, revisaoFinal, total, minhaFila);
    }
}
