-- Migration 002 : ajout des champs aspsp_name et aspsp_country dans bank_connections
-- Nécessaire pour le renouvellement PSD2 (l'app connaît la banque sans re-sélection)

ALTER TABLE bank_connections
    ADD COLUMN IF NOT EXISTS aspsp_name    TEXT NOT NULL DEFAULT '',
    ADD COLUMN IF NOT EXISTS aspsp_country TEXT NOT NULL DEFAULT 'FR';
