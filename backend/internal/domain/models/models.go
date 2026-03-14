package models

import "time"

// User représente un utilisateur dans la base de données.
type User struct {
	ID               string    `json:"id"`
	ClerkUserID      string    `json:"clerkUserId"`
	Email            *string   `json:"email"`
	SessionTokenHash *string   `json:"-"`
	CreatedAt        time.Time `json:"createdAt"`
	UpdatedAt        time.Time `json:"updatedAt"`
}

// BankConnection représente une connexion Open Banking.
type BankConnection struct {
	ID                   string     `json:"id"`
	UserID               string     `json:"userId"`
	Provider             string     `json:"provider"`
	ProviderConnectionID string     `json:"providerConnectionId"`
	AspspName            string     `json:"aspspName"`
	AspspCountry         string     `json:"aspspCountry"`
	Status               string     `json:"status"`
	ConsentExpiresAt     *time.Time `json:"consentExpiresAt"`
	CreatedAt            time.Time  `json:"createdAt"`
	UpdatedAt            time.Time  `json:"updatedAt"`
}

// BankAccount représente un compte bancaire.
type BankAccount struct {
	ID                string    `json:"id"`
	UserID            string    `json:"userId"`
	ConnectionID      string    `json:"connectionId"`
	ProviderAccountID string    `json:"providerAccountId"`
	Label             string    `json:"label"`
	MaskedIBAN        *string   `json:"maskedIban"`
	Currency          string    `json:"currency"`
	CreatedAt         time.Time `json:"createdAt"`
}

// Balance représente un solde bancaire.
type Balance struct {
	ID        string    `json:"id"`
	AccountID string    `json:"accountId"`
	Amount    float64   `json:"amount"`
	Currency  string    `json:"currency"`
	UpdatedAt time.Time `json:"updatedAt"`
	FetchedAt time.Time `json:"fetchedAt"`
}

// WalletCardMapping représente l'association carte Wallet ↔ compte.
type WalletCardMapping struct {
	ID              string    `json:"id"`
	UserID          string    `json:"userId"`
	WalletCardLabel string    `json:"walletCardLabel"`
	AccountID       string    `json:"accountId"`
	CreatedAt       time.Time `json:"createdAt"`
}

// NotificationSettings représente les préférences de notification.
type NotificationSettings struct {
	UserID              string  `json:"userId"`
	PrimaryAccountID    *string `json:"primaryAccountId"`
	SecondaryAccount1ID *string `json:"secondaryAccount1Id"`
	SecondaryAccount2ID *string `json:"secondaryAccount2Id"`
	RefreshPerDay       int     `json:"refreshPerDay"`
	PrivacyMode         bool    `json:"privacyMode"`
}

// BalanceSummaryItem est un solde affiché dans la notification.
type BalanceSummaryItem struct {
	AccountLabel string  `json:"accountLabel"`
	Amount       float64 `json:"amount"`
	Currency     string  `json:"currency"`
}

// BalanceSummary est le résumé des soldes pour la notification pré-paiement.
type BalanceSummary struct {
	Accounts  []BalanceSummaryItem `json:"accounts"`
	UpdatedAt time.Time            `json:"updatedAt"`
}

// WalletCardBalance est le solde pour une carte Wallet (notification post-paiement).
type WalletCardBalance struct {
	AccountLabel string    `json:"accountLabel"`
	Amount       float64   `json:"amount"`
	Currency     string    `json:"currency"`
	UpdatedAt    time.Time `json:"updatedAt"`
}
