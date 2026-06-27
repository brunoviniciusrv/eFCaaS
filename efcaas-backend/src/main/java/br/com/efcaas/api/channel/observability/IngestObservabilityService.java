package br.com.efcaas.api.channel.observability;

import br.com.efcaas.api.channel.core.ChannelType;
import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Timer;
import org.slf4j.MDC;
import org.springframework.stereotype.Component;

@Component
public class IngestObservabilityService {

    private final MeterRegistry meterRegistry;

    public IngestObservabilityService(MeterRegistry meterRegistry) {
        this.meterRegistry = meterRegistry;
    }

    public ChannelSpan startChannelSpan(ChannelType channelType) {
        MDC.put("channel", channelType.name());
        Timer.Sample sample = Timer.start(meterRegistry);
        return () -> {
            sample.stop(Timer.builder("ingest.duration")
                    .tag("channel", channelType.name())
                    .register(meterRegistry));
            MDC.remove("channel");
        };
    }

    @FunctionalInterface
    public interface ChannelSpan {
        void closeSpan();
    }

    public void recordSuccess(ChannelType channelType) {
        counter("ingest.requests", channelType, "success").increment();
    }

    public void recordBlocked(ChannelType channelType, String reason) {
        counter("ingest.blocked", channelType, reason).increment();
    }

    public void recordDuplicate(ChannelType channelType) {
        counter("ingest.duplicate", channelType, "duplicate").increment();
    }

    public void recordFailure(ChannelType channelType) {
        counter("ingest.requests", channelType, "failure").increment();
    }

    private Counter counter(String name, ChannelType channelType, String outcome) {
        return Counter.builder(name)
                .tag("channel", channelType.name())
                .tag("outcome", outcome)
                .register(meterRegistry);
    }
}
