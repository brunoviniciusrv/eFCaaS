package br.com.efcaas.api.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;
    private final String fromAddress;
    private final String frontendUrl;

    public EmailService(
            @Autowired(required = false) JavaMailSender mailSender,
            @Value("${efcaas.mail.from:noreply@efcaas.com}") String fromAddress,
            @Value("${efcaas.frontend-url:http://localhost:3000}") String frontendUrl) {
        this.mailSender = mailSender;
        this.fromAddress = fromAddress;
        this.frontendUrl = frontendUrl;
    }

    public void enviarAprovacaoCadastro(
            String email, String nomeAgencia, String tenantSlug, String token, boolean senhaJaDefinida) {
        String loginUrl = frontendUrl + "/#/login";
        String body;
        if (senhaJaDefinida) {
            body = """
                    Olá,

                    Sua solicitação de cadastro da agência "%s" foi APROVADA.

                    Acesse a plataforma com o e-mail cadastrado e a senha que você definiu no formulário:
                    %s

                    Equipe eFCaaS
                    """.formatted(nomeAgencia, loginUrl);
        } else {
            String link = frontendUrl + "/#/ativar?tenant=" + tenantSlug + "&token=" + token;
            body = """
                    Olá,

                    Sua solicitação de cadastro da agência "%s" foi APROVADA.

                    Para ativar sua conta e definir sua senha, acesse:
                    %s

                    Este link expira em 7 dias.

                    Equipe eFCaaS
                    """.formatted(nomeAgencia, link);
        }
        enviar(email, "Cadastro aprovado — eFCaaS", body);
    }

    public void enviarReprovacaoCadastro(String email, String nomeAgencia, String motivo) {
        String motivoTexto = motivo != null && !motivo.isBlank()
                ? "\n\nMotivo: " + motivo
                : "";
        String body = """
                Olá,

                Sua solicitação de cadastro da agência "%s" foi analisada e, neste momento, não foi aprovada.%s

                Para mais informações, entre em contato com a equipe eFCaaS.

                Equipe eFCaaS
                """.formatted(nomeAgencia, motivoTexto);
        enviar(email, "Cadastro não aprovado — eFCaaS", body);
    }

    private void enviar(String to, String subject, String body) {
        if (mailSender == null) {
            log.info("[EMAIL-DEV] Para: {} | Assunto: {} | Corpo:\n{}", to, subject, body);
            return;
        }
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(fromAddress);
        message.setTo(to);
        message.setSubject(subject);
        message.setText(body);
        mailSender.send(message);
    }
}
