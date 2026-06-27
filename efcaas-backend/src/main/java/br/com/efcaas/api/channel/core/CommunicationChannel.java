package br.com.efcaas.api.channel.core;

import org.springframework.http.ResponseEntity;

public interface CommunicationChannel {

    ChannelType type();

    void validateInbound(ChannelContext context);

    ChannelInboundMessage parseInbound(ChannelContext context);

    default ResponseEntity<?> buildSuccessResponse(Object body, boolean created) {
        return ResponseEntity.status(created ? 201 : 200).body(body);
    }

    default ResponseEntity<?> buildWebhookAckResponse() {
        return ResponseEntity.ok().build();
    }
}
