package br.com.efcaas.api.tenant;

import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Component;

@Component
public class TenantScope {

    public Long requireTenantId() {
        return TenantContext.requireTenantId();
    }

    public void assertSameTenant(Long entityTenantId) {
        if (entityTenantId == null || !requireTenantId().equals(entityTenantId)) {
            throw new AccessDeniedException("Recurso não pertence à instância da agência autenticada.");
        }
    }
}
