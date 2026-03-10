package main

import (
	"context"
	"fmt"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/clerk/clerk-sdk-go/v2"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/wallet-balance/backend/config"
	"github.com/wallet-balance/backend/internal/api"
	"github.com/wallet-balance/backend/internal/banking"
	"github.com/wallet-balance/backend/internal/crypto"
	"github.com/wallet-balance/backend/internal/repository"
)

func main() {
	// Logger structuré
	logger := slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{
		Level: slog.LevelInfo,
	}))
	slog.SetDefault(logger)

	// Charger la configuration
	cfg, err := config.Load()
	if err != nil {
		slog.Error("Erreur chargement config", "error", err)
		os.Exit(1)
	}

	// Initialiser le SDK Clerk
	clerk.SetKey(cfg.ClerkSecretKey)

	// Initialiser le service de chiffrement
	var cryptoSvc *crypto.Service
	if cfg.EncryptionKey != "" {
		cryptoSvc, err = crypto.New(cfg.EncryptionKey)
		if err != nil {
			slog.Error("Erreur initialisation crypto", "error", err)
			os.Exit(1)
		}
		slog.Info("Service de chiffrement AES-256-GCM initialisé")
	} else {
		slog.Warn("ENCRYPTION_KEY non configurée — chiffrement désactivé")
	}

	// Initialiser le client Enable Banking
	var bankClient *banking.Client
	if cfg.EnableBankingAppID != "" && cfg.EnableBankingPrivateKey != "" {
		bankClient, err = banking.New(cfg.EnableBankingAppID, cfg.EnableBankingPrivateKey)
		if err != nil {
			slog.Error("Erreur initialisation client Enable Banking", "error", err)
			os.Exit(1)
		}
		slog.Info("Client Enable Banking initialisé")
	} else {
		slog.Warn("Enable Banking non configuré — connexions bancaires désactivées")
	}

	// Connexion à la base de données Neon
	ctx := context.Background()
	poolConfig, err := pgxpool.ParseConfig(cfg.DatabaseURL)
	if err != nil {
		slog.Error("Erreur parsing DATABASE_URL", "error", err)
		os.Exit(1)
	}

	pool, err := pgxpool.NewWithConfig(ctx, poolConfig)
	if err != nil {
		slog.Error("Erreur connexion DB", "error", err)
		os.Exit(1)
	}
	defer pool.Close()

	// Vérifier la connexion
	if err := pool.Ping(ctx); err != nil {
		slog.Error("Erreur ping DB", "error", err)
		os.Exit(1)
	}
	slog.Info("Connecté à la base de données Neon")

	// Repository
	repo := repository.New(pool)

	// Router
	router := api.NewRouter(cfg, repo, bankClient, cryptoSvc)

	// Serveur HTTP
	server := &http.Server{
		Addr:         fmt.Sprintf(":%s", cfg.Port),
		Handler:      router,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	// Démarrage graceful
	go func() {
		slog.Info("Serveur démarré", "port", cfg.Port, "env", cfg.Environment)
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			slog.Error("Erreur serveur", "error", err)
			os.Exit(1)
		}
	}()

	// Attente signal d'arrêt
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	slog.Info("Arrêt du serveur...")
	shutdownCtx, cancel := context.WithTimeout(ctx, 10*time.Second)
	defer cancel()

	if err := server.Shutdown(shutdownCtx); err != nil {
		slog.Error("Erreur arrêt serveur", "error", err)
	}
	slog.Info("Serveur arrêté")
}
