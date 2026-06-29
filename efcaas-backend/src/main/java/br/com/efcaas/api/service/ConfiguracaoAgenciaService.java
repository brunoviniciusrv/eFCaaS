package br.com.efcaas.api.service;

import br.com.efcaas.api.domain.ConfiguracaoAgencia;
import br.com.efcaas.api.domain.Tenant;
import br.com.efcaas.api.domain.Usuario;
import br.com.efcaas.api.repository.ConfiguracaoAgenciaRepository;
import br.com.efcaas.api.repository.TenantRepository;
import br.com.efcaas.api.repository.UsuarioRepository;
import br.com.efcaas.api.tenant.TenantContext;
import br.com.efcaas.api.web.dto.AgencyConfigDto;
import br.com.efcaas.api.web.dto.ConfiguracaoAgenciaDto;
import br.com.efcaas.api.web.dto.SalvarConfiguracaoAgenciaRequest;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.NoSuchElementException;

@Service
@RequiredArgsConstructor
public class ConfiguracaoAgenciaService {

    private static final String DEFAULT_TENANT_SLUG = "dev";

    private final ConfiguracaoAgenciaRepository repository;
    private final TenantRepository tenantRepository;
    private final UsuarioRepository usuarioRepository;
    private final AuditoriaService auditoria;
    private final ObjectMapper objectMapper;

    @Transactional(readOnly = true)
    public ConfiguracaoAgenciaDto obter(String tenantSlug) {
        return toDto(buscarOuCriar(tenantSlug));
    }

    @Transactional
    public ConfiguracaoAgenciaDto salvar(
            SalvarConfiguracaoAgenciaRequest request,
            Long usuarioId,
            boolean autenticado,
            boolean possuiAdminSettings) {
        ConfiguracaoAgencia config = buscarOuCriar(null);

        if (!autenticado) {
            throw new AccessDeniedException("Autenticação obrigatória para alterar a configuração da agência.");
        }

        if (config.isOnboardingConcluido() && !possuiAdminSettings) {
            throw new AccessDeniedException(
                    "Somente administradores com permissão de configurações podem alterar os ajustes após a ativação.");
        }

        AgencyConfigDto agency = request.agency();
        config.setNome(trimOrDefault(agency.name(), config.getNome()));
        config.setLogoUrl(agency.logoUrl());
        config.setIdioma(trimOrDefault(agency.language(), config.getIdioma()));
        config.setPais(trimOrDefault(agency.country(), config.getPais()));
        config.setTimezone(trimOrDefault(agency.timezone(), config.getTimezone()));
        config.setOnboardingConcluido(agency.isOnboardingCompleted());
        config.setTemplateId(trimOrDefault(agency.templateId(), config.getTemplateId()));
        config.setUseDefaultProfiles(agency.useDefaultProfiles() == null || agency.useDefaultProfiles());
        config.setEnableAi(agency.enableAI() == null || agency.enableAI());
        config.setEnableSpecializedNetwork(
                agency.enableSpecializedNetwork() == null || agency.enableSpecializedNetwork());
        config.setEnableSocialSearch(agency.enableSocialSearch() == null || agency.enableSocialSearch());
        config.setEnableTrendAnalyzer(agency.enableTrendAnalyzer() == null || agency.enableTrendAnalyzer());
        config.setEnableMisinfoRisk(agency.enableMisinfoRisk() == null || agency.enableMisinfoRisk());
        config.setEnableIllicitRisk(agency.enableIllicitRisk() == null || agency.enableIllicitRisk());
        config.setTemaJson(writeThemeJson(request.theme()));
        config.setAtualizadoEm(java.time.OffsetDateTime.now());

        if (autenticado && usuarioId != null) {
            Usuario usuario = usuarioRepository.findById(usuarioId).orElse(null);
            config.setAtualizadoPor(usuario);
            auditoria.registrar(usuarioId, "configuracao_agencia_atualizada", "configuracao:" + config.getId(), config.getNome());
        }

        repository.save(config);
        return toDto(config);
    }

    private ConfiguracaoAgencia buscarOuCriar(String tenantSlug) {
        Tenant tenant = resolveTenant(tenantSlug);
        return repository.findByTenant_Id(tenant.getId()).orElseGet(() -> {
            ConfiguracaoAgencia nova = new ConfiguracaoAgencia();
            nova.setTenant(tenant);
            nova.setNome(tenant.getNome());
            nova.setTemaJson("{}");
            return repository.save(nova);
        });
    }

    private Tenant resolveTenant(String tenantSlug) {
        if (tenantSlug != null && !tenantSlug.isBlank()) {
            return tenantRepository.findBySlug(tenantSlug.trim())
                    .orElseThrow(() -> new NoSuchElementException("Tenant não encontrado: " + tenantSlug));
        }
        Long contextTenantId = TenantContext.getTenantId();
        if (contextTenantId != null) {
            return tenantRepository.findById(contextTenantId)
                    .orElseThrow(() -> new NoSuchElementException("Tenant não encontrado: " + contextTenantId));
        }
        String contextSlug = TenantContext.getTenantSlug();
        if (contextSlug != null && !contextSlug.isBlank()) {
            return tenantRepository.findBySlug(contextSlug)
                    .orElseThrow(() -> new NoSuchElementException("Tenant não encontrado: " + contextSlug));
        }
        return tenantRepository.findBySlug(DEFAULT_TENANT_SLUG)
                .orElseThrow(() -> new NoSuchElementException("Tenant padrão não encontrado: " + DEFAULT_TENANT_SLUG));
    }

    private ConfiguracaoAgenciaDto toDto(ConfiguracaoAgencia config) {
        AgencyConfigDto agency = new AgencyConfigDto(
                config.getNome(),
                config.getLogoUrl(),
                config.isOnboardingConcluido(),
                config.getIdioma(),
                config.getPais(),
                config.getTimezone(),
                config.isEnableAi(),
                config.isEnableSpecializedNetwork(),
                config.isEnableSocialSearch(),
                config.isEnableTrendAnalyzer(),
                config.isEnableMisinfoRisk(),
                config.isEnableIllicitRisk(),
                config.isUseDefaultProfiles(),
                config.getTemplateId()
        );
        return new ConfiguracaoAgenciaDto(agency, readThemeJson(config.getTemaJson()));
    }

    private JsonNode readThemeJson(String json) {
        try {
            if (json == null || json.isBlank()) {
                return objectMapper.createObjectNode();
            }
            return objectMapper.readTree(json);
        } catch (Exception e) {
            return objectMapper.createObjectNode();
        }
    }

    private String writeThemeJson(JsonNode theme) {
        try {
            return objectMapper.writeValueAsString(theme != null ? theme : objectMapper.createObjectNode());
        } catch (Exception e) {
            throw new IllegalArgumentException("Tema visual inválido");
        }
    }

    private static String trimOrDefault(String value, String fallback) {
        if (value == null || value.isBlank()) {
            return fallback;
        }
        return value.trim();
    }
}
