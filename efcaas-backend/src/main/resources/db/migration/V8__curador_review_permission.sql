-- V8: Adiciona permissão review_and_approve ao Curador
--     O Curador é responsável pelo ciclo completo de triagem → aprovação.

INSERT INTO tipo_usuario_permissao (id_tipo_usuario, id_permissao)
SELECT tu.id, p.id
FROM tipo_usuario tu
JOIN permissao p ON p.nome = 'review_and_approve'
WHERE tu.nome = 'Curador'
ON CONFLICT DO NOTHING;
