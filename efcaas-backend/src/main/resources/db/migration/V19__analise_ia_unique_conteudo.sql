-- Garante uma única análise IA por conteúdo (corrige NonUniqueResultException).

DELETE FROM analise_ia a
USING analise_ia b
WHERE a.id_conteudo = b.id_conteudo
  AND a.id < b.id;

CREATE UNIQUE INDEX IF NOT EXISTS uq_analise_ia_id_conteudo ON analise_ia (id_conteudo);
