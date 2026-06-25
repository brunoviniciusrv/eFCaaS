package br.com.efcaas.api;

import br.com.efcaas.api.config.ApiProperties;
import br.com.efcaas.api.config.GuaiaHubProperties;
import br.com.efcaas.api.config.StorageProperties;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
@EnableConfigurationProperties({StorageProperties.class, ApiProperties.class, GuaiaHubProperties.class})
public class EfcaasApiApplication {

    public static void main(String[] args) {
        SpringApplication.run(EfcaasApiApplication.class, args);
    }
}
