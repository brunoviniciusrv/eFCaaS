package br.com.efcaas.api;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
public class EfcaasApiApplication {

    public static void main(String[] args) {
        SpringApplication.run(EfcaasApiApplication.class, args);
    }
}
