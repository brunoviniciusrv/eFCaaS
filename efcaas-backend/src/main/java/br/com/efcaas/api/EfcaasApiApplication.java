package br.com.efcaas.api;

import br.com.efcaas.api.config.DenodareProperties;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
@EnableConfigurationProperties(DenodareProperties.class)
public class EfcaasApiApplication {

    public static void main(String[] args) {
        SpringApplication.run(EfcaasApiApplication.class, args);
    }
}
