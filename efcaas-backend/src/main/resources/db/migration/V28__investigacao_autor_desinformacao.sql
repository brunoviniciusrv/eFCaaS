ALTER TABLE investigacao ADD COLUMN IF NOT EXISTS autor_desinformacao TEXT;
ALTER TABLE investigacao ADD COLUMN IF NOT EXISTS autor_desinformacao_inverificavel BOOLEAN NOT NULL DEFAULT FALSE;
