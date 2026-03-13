-- Migration 003 : correction de la contrainte CHECK sur bank_connections.status
-- Ajoute le statut 'pending' utilisé lors de l'initiation d'une connexion Open Banking

ALTER TABLE bank_connections
    DROP CONSTRAINT IF EXISTS bank_connections_status_check;

ALTER TABLE bank_connections
    ADD CONSTRAINT bank_connections_status_check
    CHECK (status IN ('pending', 'active', 'expired', 'revoked'));
