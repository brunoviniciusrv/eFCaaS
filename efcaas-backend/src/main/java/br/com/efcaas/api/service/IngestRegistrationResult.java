package br.com.efcaas.api.service;

import br.com.efcaas.api.web.dto.ConteudoRecebidoDto;

public record IngestRegistrationResult(ConteudoRecebidoDto dto, boolean created) {}
