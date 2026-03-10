# Base de données — Wallet Balance Assistant

## Provider
**Neon** (PostgreSQL serverless, free tier : 0.5 GB, 100 branches)

URL de connexion : `ep-divine-tooth-ag6hn4d9-pooler.c-2.eu-central-1.aws.neon.tech` (pooler)

---

## Schéma

### users
| Colonne | Type | Contraintes |
|---|---|---|
| id | UUID | PK, gen_random_uuid() |
| clerk_user_id | TEXT | UNIQUE, NOT NULL |
| email | TEXT | UNIQUE, NOT NULL |
| created_at | TIMESTAMPTZ | DEFAULT NOW() |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() |

### bank_connections
| Colonne | Type | Contraintes |
|---|---|---|
| id | UUID | PK |
| user_id | UUID | FK → users(id) ON DELETE CASCADE |
| provider | TEXT | NOT NULL, DEFAULT 'gocardless' |
| provider_connection_id | TEXT | NOT NULL |
| access_token_encrypted | TEXT | NOT NULL |
| refresh_token_encrypted | TEXT | Nullable |
| status | TEXT | CHECK ('active', 'expired', 'revoked') |
| consent_expires_at | TIMESTAMPTZ | Nullable — expiration du consentement PSD2 |
| created_at | TIMESTAMPTZ | DEFAULT NOW() |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() |

**Index:** `idx_bank_connections_user` sur `user_id`

### bank_accounts
| Colonne | Type | Contraintes |
|---|---|---|
| id | UUID | PK |
| user_id | UUID | FK → users(id) ON DELETE CASCADE |
| connection_id | UUID | FK → bank_connections(id) ON DELETE CASCADE |
| provider_account_id | TEXT | NOT NULL |
| label | TEXT | NOT NULL |
| masked_iban | TEXT | Nullable |
| currency | TEXT | DEFAULT 'EUR' |
| created_at | TIMESTAMPTZ | DEFAULT NOW() |

**Index:** `idx_bank_accounts_user` sur `user_id`

### balances
| Colonne | Type | Contraintes |
|---|---|---|
| id | UUID | PK |
| account_id | UUID | FK → bank_accounts(id) ON DELETE CASCADE |
| amount | NUMERIC(15,2) | NOT NULL |
| currency | TEXT | DEFAULT 'EUR' |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() |
| fetched_at | TIMESTAMPTZ | DEFAULT NOW() |

**Index:** `idx_balances_account` sur `account_id`, `idx_balances_fetched` sur `fetched_at DESC`

### wallet_card_mappings
| Colonne | Type | Contraintes |
|---|---|---|
| id | UUID | PK |
| user_id | UUID | FK → users(id) ON DELETE CASCADE |
| wallet_card_label | TEXT | NOT NULL |
| account_id | UUID | FK → bank_accounts(id) ON DELETE CASCADE |
| created_at | TIMESTAMPTZ | DEFAULT NOW() |

**Contrainte unique :** `(user_id, wallet_card_label)`

### notification_settings
| Colonne | Type | Contraintes |
|---|---|---|
| user_id | UUID | PK, FK → users(id) ON DELETE CASCADE |
| primary_account_id | UUID | FK → bank_accounts(id), Nullable |
| secondary_account_1_id | UUID | FK → bank_accounts(id), Nullable |
| secondary_account_2_id | UUID | FK → bank_accounts(id), Nullable |
| refresh_per_day | INT | DEFAULT 2, CHECK (2 ou 3) |
| privacy_mode | BOOLEAN | DEFAULT FALSE |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() |

### audit_log
| Colonne | Type | Contraintes |
|---|---|---|
| id | UUID | PK, gen_random_uuid() |
| user_id | UUID | FK → users(id) ON DELETE CASCADE |
| action | TEXT | NOT NULL |
| metadata | JSONB | Nullable |
| created_at | TIMESTAMPTZ | DEFAULT NOW() |

**Index:** `idx_audit_log_user` sur `user_id`, `idx_audit_log_action` sur `action`, `idx_audit_log_created` sur `created_at DESC`

**Actions tracées :** `login`, `logout`, `register`, `bank_connect`, `bank_disconnect`, `bank_renew_consent`, `settings_update`, `card_mapping_update`, `account_selection_update`, `privacy_mode_toggle`

---

## Relations

```
users ──1:N──> bank_connections ──1:N──> bank_accounts ──1:N──> balances
users ──1:N──> wallet_card_mappings ──N:1──> bank_accounts
users ──1:1──> notification_settings
users ──1:N──> audit_log
```

---

## Migrations
Fichiers SQL dans `backend/migrations/`, ordonnés chronologiquement :
- `001_create_users.sql`
- `002_create_bank_connections.sql`
- `003_create_bank_accounts.sql`
- `004_create_balances.sql`
- `005_create_wallet_card_mappings.sql`
- `006_create_notification_settings.sql`
- `007_create_audit_log.sql`
- `008_add_consent_expires_at.sql`

---

## Sécurité des données
- Les tokens bancaires (`access_token_encrypted`, `refresh_token_encrypted`) sont chiffrés **AES-256-GCM** côté backend avant insertion.
- Les `session_token` sont des UUID v4, **hashés SHA-256** côté backend avant stockage en DB (le token en clair n'est jamais persisté).
- Cache fallback : les derniers soldes sont cachés dans le **Keychain partagé** (App Group) pour affichage offline via les App Intents.
- Toutes les suppressions en cascade via `ON DELETE CASCADE`.
