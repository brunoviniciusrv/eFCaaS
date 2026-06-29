package br.com.efcaas.api.service;

import br.com.efcaas.api.domain.TenantConteudoSeq;
import br.com.efcaas.api.repository.TenantConteudoSeqRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class TenantConteudoSeqService {

    private final TenantConteudoSeqRepository seqRepo;

    @Transactional
    public int proximoNumeroReferencia(Long tenantId) {
        TenantConteudoSeq seq = seqRepo.findByTenantIdForUpdate(tenantId)
                .orElseGet(() -> {
                    TenantConteudoSeq novo = new TenantConteudoSeq();
                    novo.setTenantId(tenantId);
                    novo.setUltimoNumero(0);
                    return seqRepo.save(novo);
                });
        int next = seq.getUltimoNumero() + 1;
        seq.setUltimoNumero(next);
        seqRepo.save(seq);
        return next;
    }
}
