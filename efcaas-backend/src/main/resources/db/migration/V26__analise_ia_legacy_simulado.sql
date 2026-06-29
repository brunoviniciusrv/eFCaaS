-- Registros legados: simulado=true com scores persistidos devem ser tratados como concluídos
UPDATE analise_ia
SET simulado = false,
    status_ia = 'concluida'
WHERE (status_ia IS NULL OR status_ia IN ('pendente', 'concluida'))
  AND simulado = true
  AND (
    score_inveracidade IS NOT NULL
    OR score_distorcao IS NOT NULL
    OR score_fora_contexto IS NOT NULL
    OR score_risco_ilicitude IS NOT NULL
    OR texto_analise IS NOT NULL
  );
