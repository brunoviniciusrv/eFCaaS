package br.com.efcaas.api.web.dto;

public record AgencyConfigDto(
        String name,
        String logoUrl,
        boolean isOnboardingCompleted,
        String language,
        String country,
        String timezone,
        Boolean enableAI,
        Boolean enableSpecializedNetwork,
        Boolean enableSocialSearch,
        Boolean enableTrendAnalyzer,
        Boolean enableMisinfoRisk,
        Boolean enableIllicitRisk,
        Boolean useDefaultProfiles,
        String templateId
) {}
