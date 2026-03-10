-- Migration V1 : Schéma initial Wallet Balance Assistant
-- Adapté pour Neon (PostgreSQL) avec Clerk comme auth provider

-- USERS : synchronisé avec Clerk (clerk_user_id = Clerk Subject)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clerk_user_id TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    session_token_hash TEXT UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- BANK_CONNECTIONS : connexions Open Banking via agrégateur
CREATE TABLE IF NOT EXISTS bank_connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    provider TEXT NOT NULL DEFAULT 'gocardless',
    provider_connection_id TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'revoked')),
    consent_expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_bank_connections_user ON bank_connections(user_id);

-- BANK_ACCOUNTS : comptes bancaires récupérés via Open Banking
CREATE TABLE IF NOT EXISTS bank_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    connection_id UUID REFERENCES bank_connections(id) ON DELETE CASCADE,
    provider_account_id TEXT NOT NULL,
    label TEXT NOT NULL,
    masked_iban TEXT,
    currency TEXT NOT NULL DEFAULT 'EUR',
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_bank_accounts_user ON bank_accounts(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_bank_accounts_unique ON bank_accounts(user_id, connection_id, provider_account_id);

-- BALANCES : derniers soldes connus
CREATE TABLE IF NOT EXISTS balances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID REFERENCES bank_accounts(id) ON DELETE CASCADE,
    amount NUMERIC(15, 2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'EUR',
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    fetched_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_balances_account ON balances(account_id);
CREATE INDEX IF NOT EXISTS idx_balances_fetched ON balances(fetched_at DESC);

-- WALLET_CARD_MAPPINGS : association carte Wallet ↔ compte bancaire
CREATE TABLE IF NOT EXISTS wallet_card_mappings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    wallet_card_label TEXT NOT NULL,
    account_id UUID REFERENCES bank_accounts(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, wallet_card_label)
);

-- NOTIFICATION_SETTINGS : préférences de notification par utilisateur
CREATE TABLE IF NOT EXISTS notification_settings (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    primary_account_id UUID REFERENCES bank_accounts(id),
    secondary_account_1_id UUID REFERENCES bank_accounts(id),
    secondary_account_2_id UUID REFERENCES bank_accounts(id),
    refresh_per_day INT NOT NULL DEFAULT 2 CHECK (refresh_per_day IN (2, 3)),
    privacy_mode BOOLEAN DEFAULT FALSE,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- AUDIT_LOG : traçabilité des événements critiques
CREATE TABLE IF NOT EXISTS audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_audit_log_user ON audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON audit_log(action);
CREATE INDEX IF NOT EXISTS idx_audit_log_created ON audit_log(created_at DESC);
