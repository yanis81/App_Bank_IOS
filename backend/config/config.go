package config

import (
	"fmt"
	"os"
	"strings"
)

// Config contient toutes les variables d'environnement du backend.
type Config struct {
	Port                    string
	DatabaseURL             string
	ClerkSecretKey          string
	EncryptionKey           string // 32 bytes hex-encoded pour AES-256
	CronKey                 string
	EnableBankingAppID      string // UUID de l'application Enable Banking
	EnableBankingPrivateKey string // Clé RSA privée PEM pour JWT RS256
	Environment             string // "development" ou "production"
	AppURL                  string // URL de l'app pour les redirections
}

// BankRedirectURL retourne l'URL de retour après connexion bancaire.
func (c *Config) BankRedirectURL() string {
	if c.AppURL != "" {
		return c.AppURL + "/bank-callback"
	}
	if c.Environment == "production" {
		return "https://walletbalance.app/bank-callback"
	}
	return "http://localhost:8081/bank-callback"
}

// Load charge la configuration depuis les variables d'environnement.
func Load() (*Config, error) {
	cfg := &Config{
		Port:           getEnv("PORT", "8080"),
		DatabaseURL:    os.Getenv("DATABASE_URL"),
		ClerkSecretKey: os.Getenv("CLERK_SECRET_KEY"),
		EncryptionKey:  os.Getenv("ENCRYPTION_KEY"),
		CronKey:        os.Getenv("CRON_KEY"),
		// La clé PEM stockée en variable d'env peut avoir des \n littéraux
		EnableBankingAppID:      os.Getenv("ENABLE_BANKING_APP_ID"),
		EnableBankingPrivateKey: strings.ReplaceAll(os.Getenv("ENABLE_BANKING_PRIVATE_KEY"), `\n`, "\n"),
		Environment:             getEnv("ENVIRONMENT", "development"),
		AppURL:                  os.Getenv("APP_URL"),
	}

	if cfg.DatabaseURL == "" {
		return nil, fmt.Errorf("DATABASE_URL est requise")
	}
	if cfg.ClerkSecretKey == "" {
		return nil, fmt.Errorf("CLERK_SECRET_KEY est requise")
	}

	return cfg, nil
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
