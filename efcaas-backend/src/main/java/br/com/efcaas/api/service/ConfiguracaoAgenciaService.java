package br.com.efcaas.api.service;

import br.com.efcaas.api.domain.ConfiguracaoAgencia;
import br.com.efcaas.api.domain.Usuario;
import br.com.efcaas.api.repository.ConfiguracaoAgenciaRepository;
import br.com.efcaas.api.repository.UsuarioRepository;
import br.com.efcaas.api.web.dto.AgencyConfigDto;
import br.com.efcaas.api.web.dto.ConfiguracaoAgenciaDto;
import br.com.efcaas.api.web.dto.SalvarConfiguracaoAgenciaRequest;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ConfiguracaoAgenciaService {

    private final ConfiguracaoAgenciaRepository repository;
    private final UsuarioRepository usuarioRepository;
    private final AuditoriaService auditoria;
    private final ObjectMapper objectMapper;

    @Transactional(readOnly = true)
    public ConfiguracaoAgenciaDto obter() {
        return toDto(buscarOuCriar());
    }

    @Transactional
    public ConfiguracaoAgenciaDto salvar(
            SalvarConfiguracaoAgenciaRequest request,
            Long usuarioId,
            boolean autenticado,
            boolean possuiAdminSettings) {
        ConfiguracaoAgencia config = buscarOuCriar();

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
            auditoria.registrar(usuarioId, "configuracao_agencia_atualizada", "configuracao:1", config.getNome());
        }

        repository.save(config);
        return toDto(config);
    }

    private ConfiguracaoAgencia buscarOuCriar() {
        return repository.findById(ConfiguracaoAgencia.SINGLETON_ID).orElseGet(() -> {
            ConfiguracaoAgencia nova = new ConfiguracaoAgencia();
            nova.setId(ConfiguracaoAgencia.SINGLETON_ID);
            nova.setNome("Agência eFCaaS");
            nova.setTemaJson("{}");
            return repository.save(nova);
        });
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
