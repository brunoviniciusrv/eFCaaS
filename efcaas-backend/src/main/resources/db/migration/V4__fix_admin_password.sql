-- V4: Corrige o hash BCrypt do admin padrão (hash do V3 era inválido)
-- Senha: Admin@2026!
UPDATE usuario
SET senha = '$2a$12$G1sSYEED5A4kk8sv6Lby0O75bccaK7IRLXoS3.svR3aroFmwODz/a'
WHERE email = 'admin@efcaas.com';
