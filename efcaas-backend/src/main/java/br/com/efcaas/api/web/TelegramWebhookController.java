package br.com.efcaas.api.web;

import br.com.efcaas.api.channel.adapter.telegram.TelegramBotChannelAdapter;
import br.com.efcaas.api.channel.core.ChannelContext;
import br.com.efcaas.api.channel.core.ChannelType;
import br.com.efcaas.api.channel.core.InboundMessageProcessor;
import br.com.efcaas.api.channel.web.IngestClientInfoResolver;
import io.swagger.v3.oas.annotations.Hidden;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.autoconfigure.condition.ConditionalOnBean;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Hidden
@RestController
@RequestMapping("/api/v1/webhooks/telegram")
@RequiredArgsConstructor
@ConditionalOnBean(TelegramBotChannelAdapter.class)
public class TelegramWebhookController {

    private final InboundMessageProcessor inboundMessageProcessor;
    private final IngestClientInfoResolver clientInfoResolver;

    @PostMapping
    public ResponseEntity<?> receive(@RequestBody String body, HttpServletRequest request) {
        HttpHeaders headers = new HttpHeaders();
        request.getHeaderNames().asIterator()
                .forEachRemaining(name -> headers.add(name, request.getHeader(name)));

        ChannelContext context = ChannelContext.of(
                ChannelType.TELEGRAM,
                clientInfoResolver.resolveClientIp(request),
                clientInfoResolver.resolveUserAgent(request),
                null,
                null,
                body,
                headers,
                null);

        return inboundMessageProcessor.processWebhook(context);
    }
}
