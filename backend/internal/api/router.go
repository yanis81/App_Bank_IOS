package api

import (
	"net/http"

	"github.com/go-chi/chi/v5"
	chimw "github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"

	"github.com/wallet-balance/backend/config"
	"github.com/wallet-balance/backend/internal/api/handlers"
	"github.com/wallet-balance/backend/internal/api/middleware"
	"github.com/wallet-balance/backend/internal/banking"
	"github.com/wallet-balance/backend/internal/crypto"
	"github.com/wallet-balance/backend/internal/repository"
)

// NewRouter crée et configure le routeur Chi avec tous les endpoints.
func NewRouter(cfg *config.Config, repo *repository.Repository, bankClient *banking.Client, cryptoSvc *crypto.Service) http.Handler {
	r := chi.NewRouter()

	// Middlewares globaux
	r.Use(chimw.RequestID)
	r.Use(chimw.RealIP)
	r.Use(middleware.RequestLogger)
	r.Use(middleware.SecurityHeaders)
	r.Use(chimw.Recoverer)
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{"https://walletbalance.app", "http://localhost:*", "exp://*"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-API-Version", "X-App-Version", "X-Cron-Key"},
		ExposedHeaders:   []string{"Link"},
		AllowCredentials: true,
		MaxAge:           300,
	}))

	h := handlers.New(repo, bankClient, cryptoSvc, &handlers.HandlersConfig{
		BankRedirectURL: cfg.BankRedirectURL(),
	})

	// Health check (public)
	r.Get("/health", h.HealthCheck)

	// Callback OAuth2 Enable Banking (public — redirige vers le deep link app)
	r.Get("/bank-callback", h.BankCallback)

	// API v1
	r.Route("/api/v1", func(r chi.Router) {
		// Routes authentifiées (Clerk JWT)
		r.Group(func(r chi.Router) {
			r.Use(middleware.ClerkAuth(repo))

			// Auth
			r.Get("/auth/me", h.GetMe)

			// Bank
			r.Get("/bank/institutions", h.GetInstitutions)
			r.Post("/bank/connect", h.InitBankConnection)
			r.Get("/bank/connect/complete", h.CompleteBankConnection)
			r.Get("/bank/connections", h.GetBankConnections)
			r.Post("/bank/connections/{id}/renew", h.RenewBankConnection)
			r.Delete("/bank/connections/{id}", h.DeleteBankConnection)
			r.Get("/bank/accounts", h.GetBankAccounts)

			// Balances
			r.Get("/balances/summary", h.GetBalanceSummary)
			r.Get("/balances/by-wallet-card", h.GetBalanceByWalletCard)

			// Wallet Card Mappings
			r.Get("/wallet-cards/mappings", h.GetWalletCardMappings)
			r.Post("/wallet-cards/mappings", h.CreateWalletCardMapping)
			r.Delete("/wallet-cards/mappings/{id}", h.DeleteWalletCardMapping)

			// Settings
			r.Get("/settings", h.GetSettings)
			r.Put("/settings", h.UpdateSettings)
		})

		// Routes cron (protégées par clé)
		r.Group(func(r chi.Router) {
			r.Use(middleware.CronKeyAuth(cfg.CronKey))
			r.Post("/jobs/refresh-balances", h.RefreshBalances)
		})
	})

	return r
}
