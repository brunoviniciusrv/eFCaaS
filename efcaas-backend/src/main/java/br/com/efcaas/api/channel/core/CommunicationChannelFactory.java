package br.com.efcaas.api.channel.core;

import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Component
public class CommunicationChannelFactory {

    private final Map<ChannelType, CommunicationChannel> channels;

    public CommunicationChannelFactory(List<CommunicationChannel> channelList) {
        this.channels = channelList.stream()
                .collect(Collectors.toMap(CommunicationChannel::type, Function.identity()));
    }

    public CommunicationChannel get(ChannelType type) {
        CommunicationChannel channel = channels.get(type);
        if (channel == null) {
            throw new IllegalArgumentException("Canal não implementado: " + type);
        }
        return channel;
    }

    public boolean isAvailable(ChannelType type) {
        return channels.containsKey(type);
    }
}
