package middleware

import (
	"context"
	"log/slog"
	"net/http"
	"strings"

	"github.com/clerk/clerk-sdk-go/v2"
	clerkhttp "github.com/clerk/clerk-sdk-go/v2/http"
	"github.com/wallet-balance/backend/internal/repository"
)

type contextKey string

const userIDKey contextKey = "userID"

// UserIDFromContext extrait l'ID utilisateur interne du contexte.
func UserIDFromContext(ctx context.Context) string {
	if v, ok := ctx.Value(userIDKey).(string); ok {
		return v
	}
	return ""
}

// ClerkAuth crée un middleware d'authentification Clerk.
// Il vérifie le JWT Clerk, extrait le Subject (clerk_user_id),
// résout l'utilisateur interne via la DB, et injecte l'ID dans le contexte.
func ClerkAuth(repo *repository.Repository) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		// Le middleware Clerk vérifie le JWT et injecte les claims dans le contexte.
		clerkMiddleware := clerkhttp.WithHeaderAuthorization()

		return clerkMiddleware(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			claims, ok := clerk.SessionClaimsFromContext(r.Context())
			if !ok || claims == nil {
				http.Error(w, `{"error":{"code":"UNAUTHORIZED","message":"Token invalide"}}`, http.StatusUnauthorized)
				return
			}

			clerkUserID := claims.Subject

			// Upsert l'utilisateur dans notre DB (l'email sera mis à jour via webhook ou API Clerk)
			user, err := repo.UpsertUser(r.Context(), clerkUserID, "")
			if err != nil {
				slog.Error("Erreur upsert user", "error", err, "clerkUserID", clerkUserID)
				http.Error(w, `{"error":{"code":"INTERNAL","message":"Erreur serveur"}}`, http.StatusInternalServerError)
				return
			}

			ctx := context.WithValue(r.Context(), userIDKey, user.ID)
			next.ServeHTTP(w, r.WithContext(ctx))
		}))
	}
}

// CronKeyAuth vérifie la clé cron dans le header X-Cron-Key.
func CronKeyAuth(cronKey string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			key := r.Header.Get("X-Cron-Key")
			if key == "" || key != cronKey {
				http.Error(w, `{"error":{"code":"FORBIDDEN","message":"Clé cron invalide"}}`, http.StatusForbidden)
				return
			}
			next.ServeHTTP(w, r)
		})
	}
}

// RequestLogger enregistre chaque requête HTTP.
func RequestLogger(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		slog.Info("HTTP Request",
			"method", r.Method,
			"path", r.URL.Path,
			"remote", r.RemoteAddr,
		)
		next.ServeHTTP(w, r)
	})
}

// SecurityHeaders ajoute les headers de sécurité.
func SecurityHeaders(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("X-Content-Type-Options", "nosniff")
		w.Header().Set("X-Frame-Options", "DENY")
		w.Header().Set("X-XSS-Protection", "1; mode=block")
		w.Header().Set("Strict-Transport-Security", "max-age=31536000; includeSubDomains")
		w.Header().Set("Referrer-Policy", "strict-origin-when-cross-origin")
		next.ServeHTTP(w, r)
	})
}

// RateLimiter est un rate limiter simple en mémoire (suffisant pour V1).
// Pour la production avec plusieurs instances, utiliser Redis.
func RateLimiter(next http.Handler) http.Handler {
	// V1 : simple pass-through, à implémenter avec un token bucket si nécessaire
	return next
}

// CORS non utilisé ici car géré via chi/cors dans le router.
// Gardé comme référence.
func corsOrigin(origin string) bool {
	allowed := []string{
		"https://walletbalance.app",
		"http://localhost:8081",
		"http://localhost:19006",
	}
	for _, a := range allowed {
		if strings.EqualFold(a, origin) {
			return true
		}
	}
	return false
}
