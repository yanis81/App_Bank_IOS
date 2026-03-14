package repository

import (
	"context"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/wallet-balance/backend/internal/domain/models"
)

// Repository gère toutes les opérations de base de données.
type Repository struct {
	pool *pgxpool.Pool
}

// New crée une nouvelle instance du Repository.
func New(pool *pgxpool.Pool) *Repository {
	return &Repository{pool: pool}
}

// Ping vérifie que la connexion à la base de données est active en exécutant une vraie requête.
// pool.Ping n'envoie qu'un message sync PostgreSQL (insuffisant pour Neon cold start).
func (r *Repository) Ping(ctx context.Context) error {
	var result int
	return r.pool.QueryRow(ctx, "SELECT 1").Scan(&result)
}

// ─── Users ───────────────────────────────────────────────

// UpsertUser crée ou met à jour un utilisateur à partir des données Clerk.
// email peut être vide — il sera stocké NULL si non fourni.
func (r *Repository) UpsertUser(ctx context.Context, clerkUserID, email string) (*models.User, error) {
	var user models.User
	var emailParam *string
	if email != "" {
		emailParam = &email
	}
	err := r.pool.QueryRow(ctx, `
		INSERT INTO users (clerk_user_id, email)
		VALUES ($1, $2)
		ON CONFLICT (clerk_user_id)
		DO UPDATE SET
			email = CASE WHEN EXCLUDED.email IS NOT NULL THEN EXCLUDED.email ELSE users.email END,
			updated_at = NOW()
		RETURNING id, clerk_user_id, email, created_at, updated_at
	`, clerkUserID, emailParam).Scan(&user.ID, &user.ClerkUserID, &user.Email, &user.CreatedAt, &user.UpdatedAt)
	if err != nil {
		return nil, fmt.Errorf("upsert user: %w", err)
	}
	return &user, nil
}

// GetUserByClerkID récupère un utilisateur par son ID Clerk.
func (r *Repository) GetUserByClerkID(ctx context.Context, clerkUserID string) (*models.User, error) {
	var user models.User
	err := r.pool.QueryRow(ctx, `
		SELECT id, clerk_user_id, email, created_at, updated_at
		FROM users WHERE clerk_user_id = $1
	`, clerkUserID).Scan(&user.ID, &user.ClerkUserID, &user.Email, &user.CreatedAt, &user.UpdatedAt)
	if err != nil {
		return nil, fmt.Errorf("get user by clerk id: %w", err)
	}
	return &user, nil
}

// ─── Bank Connections ────────────────────────────────────

// CreateBankConnection crée une connexion bancaire.
func (r *Repository) CreateBankConnection(ctx context.Context, conn *models.BankConnection) error {
	_, err := r.pool.Exec(ctx, `
		INSERT INTO bank_connections (user_id, provider, provider_connection_id, aspsp_name, aspsp_country, status, consent_expires_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
	`, conn.UserID, conn.Provider, conn.ProviderConnectionID, conn.AspspName, conn.AspspCountry, conn.Status, conn.ConsentExpiresAt)
	if err != nil {
		return fmt.Errorf("create bank connection: %w", err)
	}
	return nil
}

// GetBankConnections liste les connexions bancaires d'un utilisateur.
func (r *Repository) GetBankConnections(ctx context.Context, userID string) ([]models.BankConnection, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT id, user_id, provider, provider_connection_id, aspsp_name, aspsp_country, status, consent_expires_at, created_at, updated_at
		FROM bank_connections WHERE user_id = $1 ORDER BY created_at DESC
	`, userID)
	if err != nil {
		return nil, fmt.Errorf("get bank connections: %w", err)
	}
	defer rows.Close()

	var connections []models.BankConnection
	for rows.Next() {
		var c models.BankConnection
		if err := rows.Scan(&c.ID, &c.UserID, &c.Provider, &c.ProviderConnectionID, &c.AspspName, &c.AspspCountry, &c.Status, &c.ConsentExpiresAt, &c.CreatedAt, &c.UpdatedAt); err != nil {
			return nil, fmt.Errorf("scan bank connection: %w", err)
		}
		connections = append(connections, c)
	}
	return connections, nil
}

// GetBankConnectionByID récupère une connexion bancaire par son identifiant DB.
func (r *Repository) GetBankConnectionByID(ctx context.Context, connectionID string) (*models.BankConnection, error) {
	var c models.BankConnection
	err := r.pool.QueryRow(ctx, `
		SELECT id, user_id, provider, provider_connection_id, aspsp_name, aspsp_country, status, consent_expires_at, created_at, updated_at
		FROM bank_connections WHERE id = $1
	`, connectionID).Scan(
		&c.ID, &c.UserID, &c.Provider, &c.ProviderConnectionID, &c.AspspName, &c.AspspCountry,
		&c.Status, &c.ConsentExpiresAt, &c.CreatedAt, &c.UpdatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("connexion bancaire introuvable: %w", err)
	}
	return &c, nil
}

// GetBankConnectionByProviderID récupère une connexion via son provider_connection_id.
// Utilisé lors du callback d'autorisation pour retrouver la connexion par son state.
func (r *Repository) GetBankConnectionByProviderID(ctx context.Context, providerConnectionID string) (*models.BankConnection, error) {
	var c models.BankConnection
	err := r.pool.QueryRow(ctx, `
		SELECT id, user_id, provider, provider_connection_id, aspsp_name, aspsp_country, status, consent_expires_at, created_at, updated_at
		FROM bank_connections WHERE provider_connection_id = $1
	`, providerConnectionID).Scan(
		&c.ID, &c.UserID, &c.Provider, &c.ProviderConnectionID, &c.AspspName, &c.AspspCountry,
		&c.Status, &c.ConsentExpiresAt, &c.CreatedAt, &c.UpdatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("connexion bancaire introuvable: %w", err)
	}
	return &c, nil
}

// UpdateBankConnectionStatus met à jour le statut d'une connexion.
func (r *Repository) UpdateBankConnectionStatus(ctx context.Context, connectionID, status string) error {
	_, err := r.pool.Exec(ctx, `
		UPDATE bank_connections SET status = $1, updated_at = NOW() WHERE id = $2
	`, status, connectionID)
	if err != nil {
		return fmt.Errorf("update bank connection status: %w", err)
	}
	return nil
}

// DeleteBankConnection supprime une connexion bancaire.
func (r *Repository) DeleteBankConnection(ctx context.Context, connectionID, userID string) error {
	_, err := r.pool.Exec(ctx, `
		DELETE FROM bank_connections WHERE id = $1 AND user_id = $2
	`, connectionID, userID)
	if err != nil {
		return fmt.Errorf("delete bank connection: %w", err)
	}
	return nil
}

// ─── Bank Accounts ───────────────────────────────────────

// UpsertBankAccount crée ou met à jour un compte bancaire.
func (r *Repository) UpsertBankAccount(ctx context.Context, account *models.BankAccount) error {
	_, err := r.pool.Exec(ctx, `
		INSERT INTO bank_accounts (user_id, connection_id, provider_account_id, label, masked_iban, currency)
		VALUES ($1, $2, $3, $4, $5, $6)
		ON CONFLICT (user_id, connection_id, provider_account_id)
		DO UPDATE SET label = EXCLUDED.label, masked_iban = EXCLUDED.masked_iban
	`, account.UserID, account.ConnectionID, account.ProviderAccountID, account.Label, account.MaskedIBAN, account.Currency)
	if err != nil {
		return fmt.Errorf("upsert bank account: %w", err)
	}
	return nil
}

// GetBankAccounts liste les comptes bancaires d'un utilisateur.
func (r *Repository) GetBankAccounts(ctx context.Context, userID string) ([]models.BankAccount, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT id, user_id, connection_id, provider_account_id, label, masked_iban, currency, created_at
		FROM bank_accounts WHERE user_id = $1 ORDER BY label ASC
	`, userID)
	if err != nil {
		return nil, fmt.Errorf("get bank accounts: %w", err)
	}
	defer rows.Close()

	var accounts []models.BankAccount
	for rows.Next() {
		var a models.BankAccount
		if err := rows.Scan(&a.ID, &a.UserID, &a.ConnectionID, &a.ProviderAccountID, &a.Label, &a.MaskedIBAN, &a.Currency, &a.CreatedAt); err != nil {
			return nil, fmt.Errorf("scan bank account: %w", err)
		}
		accounts = append(accounts, a)
	}
	return accounts, nil
}

// ─── Balances ────────────────────────────────────────────

// UpsertBalance crée ou met à jour un solde.
func (r *Repository) UpsertBalance(ctx context.Context, accountID string, amount float64, currency string) error {
	_, err := r.pool.Exec(ctx, `
		INSERT INTO balances (account_id, amount, currency)
		VALUES ($1, $2, $3)
		ON CONFLICT (account_id)
		DO UPDATE SET amount = EXCLUDED.amount, currency = EXCLUDED.currency, updated_at = NOW(), fetched_at = NOW()
	`, accountID, amount, currency)
	if err != nil {
		return fmt.Errorf("upsert balance: %w", err)
	}
	return nil
}

// GetBalanceSummary récupère le résumé des soldes pour la notification.
func (r *Repository) GetBalanceSummary(ctx context.Context, userID string) (*models.BalanceSummary, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT ba.label, b.amount, b.currency, b.updated_at
		FROM notification_settings ns
		JOIN LATERAL (
			SELECT unnest(ARRAY[ns.primary_account_id, ns.secondary_account_1_id, ns.secondary_account_2_id]) AS account_id
		) ids ON TRUE
		JOIN bank_accounts ba ON ba.id = ids.account_id
		JOIN balances b ON b.account_id = ba.id
		WHERE ns.user_id = $1
		ORDER BY 
			CASE ids.account_id 
				WHEN ns.primary_account_id THEN 1
				WHEN ns.secondary_account_1_id THEN 2
				ELSE 3
			END
	`, userID)
	if err != nil {
		return nil, fmt.Errorf("get balance summary: %w", err)
	}
	defer rows.Close()

	summary := &models.BalanceSummary{}
	for rows.Next() {
		var item models.BalanceSummaryItem
		var updatedAt interface{}
		if err := rows.Scan(&item.AccountLabel, &item.Amount, &item.Currency, &updatedAt); err != nil {
			return nil, fmt.Errorf("scan balance summary: %w", err)
		}
		summary.Accounts = append(summary.Accounts, item)
	}
	return summary, nil
}

// GetBalanceByWalletCard récupère le solde associé à une carte Wallet.
func (r *Repository) GetBalanceByWalletCard(ctx context.Context, userID, cardLabel string) (*models.WalletCardBalance, error) {
	var result models.WalletCardBalance
	err := r.pool.QueryRow(ctx, `
		SELECT ba.label, b.amount, b.currency, b.updated_at
		FROM wallet_card_mappings wcm
		JOIN bank_accounts ba ON ba.id = wcm.account_id
		JOIN balances b ON b.account_id = ba.id
		WHERE wcm.user_id = $1 AND wcm.wallet_card_label = $2
	`, userID, cardLabel).Scan(&result.AccountLabel, &result.Amount, &result.Currency, &result.UpdatedAt)
	if err != nil {
		return nil, fmt.Errorf("get balance by wallet card: %w", err)
	}
	return &result, nil
}

// ─── Wallet Card Mappings ────────────────────────────────

// GetWalletCardMappings liste les mappings de cartes d'un utilisateur.
func (r *Repository) GetWalletCardMappings(ctx context.Context, userID string) ([]models.WalletCardMapping, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT id, user_id, wallet_card_label, account_id, created_at
		FROM wallet_card_mappings WHERE user_id = $1 ORDER BY created_at ASC
	`, userID)
	if err != nil {
		return nil, fmt.Errorf("get wallet card mappings: %w", err)
	}
	defer rows.Close()

	var mappings []models.WalletCardMapping
	for rows.Next() {
		var m models.WalletCardMapping
		if err := rows.Scan(&m.ID, &m.UserID, &m.WalletCardLabel, &m.AccountID, &m.CreatedAt); err != nil {
			return nil, fmt.Errorf("scan wallet card mapping: %w", err)
		}
		mappings = append(mappings, m)
	}
	return mappings, nil
}

// UpsertWalletCardMapping crée ou met à jour un mapping carte.
func (r *Repository) UpsertWalletCardMapping(ctx context.Context, userID, cardLabel, accountID string) error {
	_, err := r.pool.Exec(ctx, `
		INSERT INTO wallet_card_mappings (user_id, wallet_card_label, account_id)
		VALUES ($1, $2, $3)
		ON CONFLICT (user_id, wallet_card_label)
		DO UPDATE SET account_id = EXCLUDED.account_id
	`, userID, cardLabel, accountID)
	if err != nil {
		return fmt.Errorf("upsert wallet card mapping: %w", err)
	}
	return nil
}

// DeleteWalletCardMapping supprime un mapping carte.
func (r *Repository) DeleteWalletCardMapping(ctx context.Context, mappingID, userID string) error {
	_, err := r.pool.Exec(ctx, `
		DELETE FROM wallet_card_mappings WHERE id = $1 AND user_id = $2
	`, mappingID, userID)
	if err != nil {
		return fmt.Errorf("delete wallet card mapping: %w", err)
	}
	return nil
}

// ─── Notification Settings ───────────────────────────────

// GetNotificationSettings récupère les réglages de notification.
func (r *Repository) GetNotificationSettings(ctx context.Context, userID string) (*models.NotificationSettings, error) {
	var s models.NotificationSettings
	err := r.pool.QueryRow(ctx, `
		SELECT user_id, primary_account_id, secondary_account_1_id, secondary_account_2_id, refresh_per_day, privacy_mode
		FROM notification_settings WHERE user_id = $1
	`, userID).Scan(&s.UserID, &s.PrimaryAccountID, &s.SecondaryAccount1ID, &s.SecondaryAccount2ID, &s.RefreshPerDay, &s.PrivacyMode)
	if err != nil {
		return nil, fmt.Errorf("get notification settings: %w", err)
	}
	return &s, nil
}

// UpsertNotificationSettings crée ou met à jour les réglages.
func (r *Repository) UpsertNotificationSettings(ctx context.Context, s *models.NotificationSettings) error {
	_, err := r.pool.Exec(ctx, `
		INSERT INTO notification_settings (user_id, primary_account_id, secondary_account_1_id, secondary_account_2_id, refresh_per_day, privacy_mode)
		VALUES ($1, $2, $3, $4, $5, $6)
		ON CONFLICT (user_id)
		DO UPDATE SET
			primary_account_id = EXCLUDED.primary_account_id,
			secondary_account_1_id = EXCLUDED.secondary_account_1_id,
			secondary_account_2_id = EXCLUDED.secondary_account_2_id,
			refresh_per_day = EXCLUDED.refresh_per_day,
			privacy_mode = EXCLUDED.privacy_mode,
			updated_at = NOW()
	`, s.UserID, s.PrimaryAccountID, s.SecondaryAccount1ID, s.SecondaryAccount2ID, s.RefreshPerDay, s.PrivacyMode)
	if err != nil {
		return fmt.Errorf("upsert notification settings: %w", err)
	}
	return nil
}

// ─── Audit Log ───────────────────────────────────────────

// CreateAuditLog enregistre un événement dans le log d'audit.
func (r *Repository) CreateAuditLog(ctx context.Context, userID, action string, metadata map[string]interface{}) error {
	_, err := r.pool.Exec(ctx, `
		INSERT INTO audit_log (user_id, action, metadata)
		VALUES ($1, $2, $3)
	`, userID, action, metadata)
	if err != nil {
		return fmt.Errorf("create audit log: %w", err)
	}
	return nil
}

// ─── Bank Connections (extended) ───────────────────────

// GetAllActiveBankConnections récupère toutes les connexions actives (pour le cron refresh).
func (r *Repository) GetAllActiveBankConnections(ctx context.Context) ([]models.BankConnection, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT id, user_id, provider, provider_connection_id, status, consent_expires_at, created_at, updated_at
		FROM bank_connections WHERE status = 'active'
	`)
	if err != nil {
		return nil, fmt.Errorf("get all active bank connections: %w", err)
	}
	defer rows.Close()

	var connections []models.BankConnection
	for rows.Next() {
		var c models.BankConnection
		if err := rows.Scan(&c.ID, &c.UserID, &c.Provider, &c.ProviderConnectionID, &c.Status, &c.ConsentExpiresAt, &c.CreatedAt, &c.UpdatedAt); err != nil {
			return nil, fmt.Errorf("scan bank connection: %w", err)
		}
		connections = append(connections, c)
	}
	return connections, nil
}

// GetBankAccountsByConnection récupère les comptes d'une connexion spécifique.
func (r *Repository) GetBankAccountsByConnection(ctx context.Context, connectionID string) ([]models.BankAccount, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT id, user_id, connection_id, provider_account_id, label, masked_iban, currency, created_at
		FROM bank_accounts WHERE connection_id = $1 ORDER BY label ASC
	`, connectionID)
	if err != nil {
		return nil, fmt.Errorf("get bank accounts by connection: %w", err)
	}
	defer rows.Close()

	var accounts []models.BankAccount
	for rows.Next() {
		var a models.BankAccount
		if err := rows.Scan(&a.ID, &a.UserID, &a.ConnectionID, &a.ProviderAccountID, &a.Label, &a.MaskedIBAN, &a.Currency, &a.CreatedAt); err != nil {
			return nil, fmt.Errorf("scan bank account: %w", err)
		}
		accounts = append(accounts, a)
	}
	return accounts, nil
}

// UpdateBankConnectionRequisition met à jour l'ID de requisition et l'expiration d'une connexion.
func (r *Repository) UpdateBankConnectionRequisition(ctx context.Context, connectionID, requisitionID string, expiresAt *time.Time) error {
	_, err := r.pool.Exec(ctx, `
		UPDATE bank_connections
		SET provider_connection_id = $1, consent_expires_at = $2, updated_at = NOW()
		WHERE id = $3
	`, requisitionID, expiresAt, connectionID)
	if err != nil {
		return fmt.Errorf("update bank connection requisition: %w", err)
	}
	return nil
}

// ─── Helper types ────────────────────────────────────────

// NotificationSettingsForUpsert est un helper pour construire les settings avant upsert.
type NotificationSettingsForUpsert struct {
	UserID              string
	PrimaryAccountID    *string
	SecondaryAccount1ID *string
	SecondaryAccount2ID *string
	RefreshPerDay       int
	PrivacyMode         bool
}

// ToModel convertit vers le modèle de domaine.
func (s *NotificationSettingsForUpsert) ToModel() *models.NotificationSettings {
	return &models.NotificationSettings{
		UserID:              s.UserID,
		PrimaryAccountID:    s.PrimaryAccountID,
		SecondaryAccount1ID: s.SecondaryAccount1ID,
		SecondaryAccount2ID: s.SecondaryAccount2ID,
		RefreshPerDay:       s.RefreshPerDay,
		PrivacyMode:         s.PrivacyMode,
	}
}
