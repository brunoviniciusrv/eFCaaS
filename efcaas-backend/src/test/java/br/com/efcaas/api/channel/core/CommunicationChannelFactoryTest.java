package br.com.efcaas.api.channel.core;

import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class CommunicationChannelFactoryTest {

    @Test
    void get_returnsRegisteredChannel() {
        CommunicationChannel rest = mock(CommunicationChannel.class);
        when(rest.type()).thenReturn(ChannelType.REST);

        CommunicationChannelFactory factory = new CommunicationChannelFactory(List.of(rest));

        assertThat(factory.get(ChannelType.REST)).isSameAs(rest);
        assertThat(factory.isAvailable(ChannelType.REST)).isTrue();
        assertThat(factory.isAvailable(ChannelType.INSTAGRAM)).isFalse();
    }

    @Test
    void get_throwsWhenChannelNotImplemented() {
        CommunicationChannelFactory factory = new CommunicationChannelFactory(List.of());

        assertThatThrownBy(() -> factory.get(ChannelType.WHATSAPP))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("WHATSAPP");
    }
}
