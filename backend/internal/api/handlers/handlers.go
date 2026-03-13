package handlers

import (
	"crypto/rand"
	"encoding/json"
	"fmt"
	"log/slog"
	"net/http"
	"strconv"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/wallet-balance/backend/internal/api/middleware"
	"github.com/wallet-balance/backend/internal/banking"
	"github.com/wallet-balance/backend/internal/crypto"
	"github.com/wallet-balance/backend/internal/domain/models"
	"github.com/wallet-balance/backend/internal/repository"
)

// ─── Helpers internes ────────────────────────────────────

// generateState génère un UUID v4 aléatoire pour le paramètre state OAuth2.
func generateState() string {
	b := make([]byte, 16)
	rand.Read(b)
	b[6] = (b[6] & 0x0f) | 0x40 // Version 4
	b[8] = (b[8] & 0x3f) | 0x80 // Variant RFC 4122
	return fmt.Sprintf("%x-%x-%x-%x-%x", b[0:4], b[4:6], b[6:8], b[8:10], b[10:])
}

// bestBalance sélectionne le solde le plus pertinent selon les types ISO 20022 Enable Banking.
// Priorité : ITAV (disponible interim) > CLAV (disponible fin de journée) > ITBD > CLBD > premier disponible.
func bestBalance(balances []banking.BalanceItem) (amount float64, currency string) {
	priority := []string{"ITAV", "CLAV", "ITBD", "CLBD"}
	byType := make(map[string]banking.BalanceItem, len(balances))
	for _, b := range balances {
		byType[b.BalanceType] = b
	}
	for _, t := range priority {
		if b, ok := byType[t]; ok {
			amount, _ = strconv.ParseFloat(b.BalanceAmount.Amount, 64)
			return amount, b.BalanceAmount.Currency
		}
	}
	if len(balances) > 0 {
		amount, _ = strconv.ParseFloat(balances[0].BalanceAmount.Amount, 64)
		return amount, balances[0].BalanceAmount.Currency
	}
	return 0, "EUR"
}

// Handlers contient tous les handlers HTTP.
type Handlers struct {
	repo   *repository.Repository
	bank   *banking.Client
	crypto *crypto.Service
	cfg    *HandlersConfig
}

// HandlersConfig contient la configuration nécessaire aux handlers.
type HandlersConfig struct {
	BankRedirectURL string // URL de retour après connexion bancaire
}

// New crée une nouvelle instance des handlers.
func New(repo *repository.Repository, bank *banking.Client, cryptoSvc *crypto.Service, cfg *HandlersConfig) *Handlers {
	return &Handlers{repo: repo, bank: bank, crypto: cryptoSvc, cfg: cfg}
}

// ─── Helpers ─────────────────────────────────────────────

func writeJSON(w http.ResponseWriter, status int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"data":    data,
	})
}

func writeError(w http.ResponseWriter, status int, code, message string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": false,
		"error": map[string]string{
			"code":    code,
			"message": message,
		},
	})
}

func decodeJSON(r *http.Request, v interface{}) error {
	defer r.Body.Close()
	return json.NewDecoder(r.Body).Decode(v)
}

// ─── Auth ────────────────────────────────────────────────

// GetMe retourne les informations de l'utilisateur courant.
func (h *Handlers) GetMe(w http.ResponseWriter, r *http.Request) {
	userID := middleware.UserIDFromContext(r.Context())
	if userID == "" {
		writeError(w, http.StatusUnauthorized, "UNAUTHORIZED", "Non authentifié")
		return
	}

	// L'utilisateur est déjà upserted par le middleware auth.
	// On récupère ses infos depuis la DB pour les retourner.
	user, err := h.repo.GetUserByClerkID(r.Context(), userID)
	if err != nil {
		// userID est l'ID interne, pas le Clerk ID. On utilise une query par ID interne.
		writeError(w, http.StatusInternalServerError, "INTERNAL", "Erreur serveur")
		return
	}

	writeJSON(w, http.StatusOK, user)
}

// ─── Bank Connections ────────────────────────────────────

// GetBankConnections liste les connexions bancaires.
func (h *Handlers) GetBankConnections(w http.ResponseWriter, r *http.Request) {
	userID := middleware.UserIDFromContext(r.Context())
	connections, err := h.repo.GetBankConnections(r.Context(), userID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "INTERNAL", "Erreur serveur")
		return
	}
	if connections == nil {
		connections = []models.BankConnection{}
	}
	writeJSON(w, http.StatusOK, connections)
}

// ─── Bank Accounts ───────────────────────────────────────

// GetBankAccounts liste les comptes bancaires.
func (h *Handlers) GetBankAccounts(w http.ResponseWriter, r *http.Request) {
	userID := middleware.UserIDFromContext(r.Context())
	accounts, err := h.repo.GetBankAccounts(r.Context(), userID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "INTERNAL", "Erreur serveur")
		return
	}
	if accounts == nil {
		accounts = []models.BankAccount{}
	}
	writeJSON(w, http.StatusOK, accounts)
}

// ─── Balances ────────────────────────────────────────────

// GetBalanceSummary retourne le résumé des soldes.
func (h *Handlers) GetBalanceSummary(w http.ResponseWriter, r *http.Request) {
	userID := middleware.UserIDFromContext(r.Context())
	summary, err := h.repo.GetBalanceSummary(r.Context(), userID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "INTERNAL", "Erreur serveur")
		return
	}
	if summary.Accounts == nil {
		summary.Accounts = []models.BalanceSummaryItem{}
	}
	writeJSON(w, http.StatusOK, summary)
}

// GetBalanceByWalletCard retourne le solde associé à une carte Wallet.
func (h *Handlers) GetBalanceByWalletCard(w http.ResponseWriter, r *http.Request) {
	userID := middleware.UserIDFromContext(r.Context())
	cardLabel := r.URL.Query().Get("cardLabel")
	if cardLabel == "" {
		writeError(w, http.StatusBadRequest, "VALIDATION", "cardLabel est requis")
		return
	}

	balance, err := h.repo.GetBalanceByWalletCard(r.Context(), userID, cardLabel)
	if err != nil {
		writeError(w, http.StatusNotFound, "CARD_NOT_MAPPED", "Carte non configurée")
		return
	}
	writeJSON(w, http.StatusOK, balance)
}

// ─── Wallet Card Mappings ────────────────────────────────

// GetWalletCardMappings liste les mappings de cartes.
func (h *Handlers) GetWalletCardMappings(w http.ResponseWriter, r *http.Request) {
	userID := middleware.UserIDFromContext(r.Context())
	mappings, err := h.repo.GetWalletCardMappings(r.Context(), userID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "INTERNAL", "Erreur serveur")
		return
	}
	if mappings == nil {
		mappings = []models.WalletCardMapping{}
	}
	writeJSON(w, http.StatusOK, mappings)
}

// CreateWalletCardMapping crée ou met à jour un mapping carte.
func (h *Handlers) CreateWalletCardMapping(w http.ResponseWriter, r *http.Request) {
	userID := middleware.UserIDFromContext(r.Context())

	var body struct {
		WalletCardLabel string `json:"walletCardLabel"`
		AccountID       string `json:"accountId"`
	}
	if err := decodeJSON(r, &body); err != nil {
		writeError(w, http.StatusBadRequest, "VALIDATION", "Corps de requête invalide")
		return
	}
	if body.WalletCardLabel == "" || body.AccountID == "" {
		writeError(w, http.StatusBadRequest, "VALIDATION", "walletCardLabel et accountId sont requis")
		return
	}

	if err := h.repo.UpsertWalletCardMapping(r.Context(), userID, body.WalletCardLabel, body.AccountID); err != nil {
		writeError(w, http.StatusInternalServerError, "INTERNAL", "Erreur serveur")
		return
	}
	writeJSON(w, http.StatusCreated, map[string]string{"status": "created"})
}

// DeleteWalletCardMapping supprime un mapping carte.
func (h *Handlers) DeleteWalletCardMapping(w http.ResponseWriter, r *http.Request) {
	userID := middleware.UserIDFromContext(r.Context())
	mappingID := chi.URLParam(r, "id")
	if mappingID == "" {
		writeError(w, http.StatusBadRequest, "VALIDATION", "ID du mapping requis")
		return
	}

	if err := h.repo.DeleteWalletCardMapping(r.Context(), mappingID, userID); err != nil {
		writeError(w, http.StatusInternalServerError, "INTERNAL", "Erreur serveur")
		return
	}
	writeJSON(w, http.StatusOK, map[string]string{"status": "deleted"})
}

// ─── Notification Settings ───────────────────────────────

// GetSettings retourne les réglages de notification.
func (h *Handlers) GetSettings(w http.ResponseWriter, r *http.Request) {
	userID := middleware.UserIDFromContext(r.Context())
	settings, err := h.repo.GetNotificationSettings(r.Context(), userID)
	if err != nil {
		// Pas de settings = retourner les valeurs par défaut
		writeJSON(w, http.StatusOK, map[string]interface{}{
			"userId":        userID,
			"refreshPerDay": 2,
			"privacyMode":   false,
		})
		return
	}
	writeJSON(w, http.StatusOK, settings)
}

// UpdateSettings met à jour les réglages de notification.
func (h *Handlers) UpdateSettings(w http.ResponseWriter, r *http.Request) {
	userID := middleware.UserIDFromContext(r.Context())

	var body struct {
		PrimaryAccountID    *string `json:"primaryAccountId"`
		SecondaryAccount1ID *string `json:"secondaryAccount1Id"`
		SecondaryAccount2ID *string `json:"secondaryAccount2Id"`
		RefreshPerDay       *int    `json:"refreshPerDay"`
		PrivacyMode         *bool   `json:"privacyMode"`
	}
	if err := decodeJSON(r, &body); err != nil {
		writeError(w, http.StatusBadRequest, "VALIDATION", "Corps de requête invalide")
		return
	}

	// Récupérer les settings existants pour merger
	existing, _ := h.repo.GetNotificationSettings(r.Context(), userID)
	settings := &repository.NotificationSettingsForUpsert{
		UserID: userID,
	}

	if existing != nil {
		settings.PrimaryAccountID = existing.PrimaryAccountID
		settings.SecondaryAccount1ID = existing.SecondaryAccount1ID
		settings.SecondaryAccount2ID = existing.SecondaryAccount2ID
		settings.RefreshPerDay = existing.RefreshPerDay
		settings.PrivacyMode = existing.PrivacyMode
	} else {
		settings.RefreshPerDay = 2
	}

	if body.PrimaryAccountID != nil {
		settings.PrimaryAccountID = body.PrimaryAccountID
	}
	if body.SecondaryAccount1ID != nil {
		settings.SecondaryAccount1ID = body.SecondaryAccount1ID
	}
	if body.SecondaryAccount2ID != nil {
		settings.SecondaryAccount2ID = body.SecondaryAccount2ID
	}
	if body.RefreshPerDay != nil {
		if *body.RefreshPerDay != 2 && *body.RefreshPerDay != 3 {
			writeError(w, http.StatusBadRequest, "VALIDATION", "refreshPerDay doit être 2 ou 3")
			return
		}
		settings.RefreshPerDay = *body.RefreshPerDay
	}
	if body.PrivacyMode != nil {
		settings.PrivacyMode = *body.PrivacyMode
	}

	if err := h.repo.UpsertNotificationSettings(r.Context(), settings.ToModel()); err != nil {
		writeError(w, http.StatusInternalServerError, "INTERNAL", "Erreur serveur")
		return
	}
	writeJSON(w, http.StatusOK, map[string]string{"status": "updated"})
}

// ─── Bank Connect ────────────────────────────────────────

// InitBankConnection initie une connexion Open Banking via Enable Banking.
// Génère un state UUID, appelle POST /auth, stocke la connexion en attente.
func (h *Handlers) InitBankConnection(w http.ResponseWriter, r *http.Request) {
	userID := middleware.UserIDFromContext(r.Context())

	var body struct {
		AspspName    string `json:"aspspName"`
		AspspCountry string `json:"aspspCountry"`
	}
	if err := decodeJSON(r, &body); err != nil {
		writeError(w, http.StatusBadRequest, "VALIDATION", "Corps de requête invalide")
		return
	}
	if body.AspspName == "" || body.AspspCountry == "" {
		writeError(w, http.StatusBadRequest, "VALIDATION", "aspspName et aspspCountry sont requis")
		return
	}

	// Générer un state UUID aléatoire pour sécuriser le callback
	state := generateState()

	// Initier l'autorisation PSU
	authURL, err := h.bank.InitAuth(r.Context(), body.AspspName, body.AspspCountry, h.cfg.BankRedirectURL, state)
	if err != nil {
		slog.Error("Erreur initiation auth Enable Banking", "error", err, "userID", userID)
		writeError(w, http.StatusBadGateway, "BANKING_ERROR", "Impossible d'initier la connexion bancaire")
		return
	}

	// Stocker la connexion avec le state comme identifiant provisoire
	expiresAt := time.Now().Add(90 * 24 * time.Hour)
	conn := &models.BankConnection{
		UserID:               userID,
		Provider:             "enablebanking",
		ProviderConnectionID: state,
		AspspName:            body.AspspName,
		AspspCountry:         body.AspspCountry,
		Status:               "pending",
		ConsentExpiresAt:     &expiresAt,
	}
	if err := h.repo.CreateBankConnection(r.Context(), conn); err != nil {
		slog.Error("Erreur stockage connexion", "error", err, "userID", userID)
		writeError(w, http.StatusInternalServerError, "INTERNAL", "Erreur serveur")
		return
	}

	_ = h.repo.CreateAuditLog(r.Context(), userID, "bank_connect_initiated", map[string]interface{}{
		"aspsp_name":    body.AspspName,
		"aspsp_country": body.AspspCountry,
		"state":         state,
	})

	writeJSON(w, http.StatusOK, map[string]string{
		"link":  authURL,
		"state": state,
	})
}

// CompleteBankConnection finalise une connexion après le retour de la banque.
// Reçoit code + state (paramètres OAuth2 du callback Enable Banking).
// Corrige le state en session_id et importe les comptes avec leur ConnectionID DB correct.
func (h *Handlers) CompleteBankConnection(w http.ResponseWriter, r *http.Request) {
	userID := middleware.UserIDFromContext(r.Context())
	code := r.URL.Query().Get("code")
	state := r.URL.Query().Get("state")
	if code == "" || state == "" {
		writeError(w, http.StatusBadRequest, "VALIDATION", "code et state sont requis")
		return
	}

	// Retrouver la connexion par state (stocké comme provider_connection_id lors de InitAuth)
	conn, err := h.repo.GetBankConnectionByProviderID(r.Context(), state)
	if err != nil {
		slog.Error("Connexion introuvable via state", "error", err, "state", state)
		writeError(w, http.StatusNotFound, "CONNECTION_NOT_FOUND", "Connexion bancaire introuvable")
		return
	}
	// Vérifier que la connexion appartient bien à l'utilisateur courant
	if conn.UserID != userID {
		writeError(w, http.StatusForbidden, "FORBIDDEN", "Accès refusé")
		return
	}

	// Échanger le code contre une session Enable Banking
	session, err := h.bank.CreateSession(r.Context(), code)
	if err != nil {
		slog.Error("Erreur création session Enable Banking", "error", err)
		writeError(w, http.StatusBadGateway, "BANKING_ERROR", "Impossible de finaliser la connexion bancaire")
		return
	}

	// Mettre à jour la connexion : provider_connection_id = session_id, statut = active
	expiresAt := time.Now().Add(90 * 24 * time.Hour)
	_ = h.repo.UpdateBankConnectionRequisition(r.Context(), conn.ID, session.SessionID, &expiresAt)
	_ = h.repo.UpdateBankConnectionStatus(r.Context(), conn.ID, "active")

	// Importer les comptes depuis la session (info déjà disponible, pas d'appel supplémentaire)
	importedCount := 0
	for _, acc := range session.Accounts {
		if acc.UID == "" {
			continue
		}

		label := acc.Name
		if label == "" {
			label = "Compte " + acc.UID[:8]
		}

		var maskedIBAN *string
		if iban := acc.AccountID.IBAN; iban != "" && len(iban) >= 4 {
			masked := "****" + iban[len(iban)-4:]
			maskedIBAN = &masked
		}

		currency := acc.Currency
		if currency == "" {
			currency = "EUR"
		}

		// ConnectionID = DB UUID de bank_connections (PK), pas le provider ID
		account := &models.BankAccount{
			UserID:            userID,
			ConnectionID:      conn.ID,
			ProviderAccountID: acc.UID,
			Label:             label,
			MaskedIBAN:        maskedIBAN,
			Currency:          currency,
		}
		if err := h.repo.UpsertBankAccount(r.Context(), account); err != nil {
			slog.Warn("Erreur upsert account", "error", err, "uid", acc.UID)
			continue
		}

		// Récupérer les soldes initiaux
		balances, err := h.bank.GetAccountBalances(r.Context(), acc.UID)
		if err != nil {
			slog.Warn("Erreur soldes initiaux", "error", err, "uid", acc.UID)
		} else if len(balances) > 0 {
			amount, cur := bestBalance(balances)
			_ = h.repo.UpsertBalance(r.Context(), account.ID, amount, cur)
		}

		importedCount++
	}

	_ = h.repo.CreateAuditLog(r.Context(), userID, "bank_connect_completed", map[string]interface{}{
		"session_id":        session.SessionID,
		"accounts_imported": importedCount,
	})

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"status":           "connected",
		"accountsImported": importedCount,
	})
}

// RenewBankConnection renouvelle le consentement PSD2 pour une connexion existe.
// Initie un nouveau flow d'autorisation PSU et met à jour le state en attente.
func (h *Handlers) RenewBankConnection(w http.ResponseWriter, r *http.Request) {
	userID := middleware.UserIDFromContext(r.Context())
	connectionID := chi.URLParam(r, "id")
	if connectionID == "" {
		writeError(w, http.StatusBadRequest, "VALIDATION", "ID de connexion requis")
		return
	}

	var body struct {
		AspspName    string `json:"aspspName"`
		AspspCountry string `json:"aspspCountry"`
	}
	if err := decodeJSON(r, &body); err != nil || body.AspspName == "" || body.AspspCountry == "" {
		writeError(w, http.StatusBadRequest, "VALIDATION", "aspspName et aspspCountry sont requis")
		return
	}

	newState := generateState()
	authURL, err := h.bank.InitAuth(r.Context(), body.AspspName, body.AspspCountry, h.cfg.BankRedirectURL, newState)
	if err != nil {
		writeError(w, http.StatusBadGateway, "BANKING_ERROR", "Impossible de renouveler la connexion")
		return
	}

	expiresAt := time.Now().Add(90 * 24 * time.Hour)
	_ = h.repo.UpdateBankConnectionStatus(r.Context(), connectionID, "pending")
	_ = h.repo.UpdateBankConnectionRequisition(r.Context(), connectionID, newState, &expiresAt)

	_ = h.repo.CreateAuditLog(r.Context(), userID, "bank_consent_renewed", map[string]interface{}{
		"connection_id": connectionID,
		"new_state":     newState,
	})

	writeJSON(w, http.StatusOK, map[string]string{
		"link":  authURL,
		"state": newState,
	})
}

// DeleteBankConnection supprime une connexion bancaire.
// Révoque la session Enable Banking, puis supprime en DB.
func (h *Handlers) DeleteBankConnection(w http.ResponseWriter, r *http.Request) {
	userID := middleware.UserIDFromContext(r.Context())
	connectionID := chi.URLParam(r, "id")
	if connectionID == "" {
		writeError(w, http.StatusBadRequest, "VALIDATION", "ID de connexion requis")
		return
	}

	// Récupérer le session_id stocké dans provider_connection_id
	conn, err := h.repo.GetBankConnectionByID(r.Context(), connectionID)
	if err == nil && conn.Status == "active" {
		// Révoquer la session côté Enable Banking (best-effort)
		_ = h.bank.DeleteSession(r.Context(), conn.ProviderConnectionID)
	}

	// Supprimer en DB (cascade supprime les comptes et les soldes associés)
	if err := h.repo.DeleteBankConnection(r.Context(), connectionID, userID); err != nil {
		writeError(w, http.StatusInternalServerError, "INTERNAL", "Erreur serveur")
		return
	}

	_ = h.repo.CreateAuditLog(r.Context(), userID, "bank_connection_deleted", map[string]interface{}{
		"connection_id": connectionID,
	})

	writeJSON(w, http.StatusOK, map[string]string{"status": "deleted"})
}

// GetInstitutions retourne la liste des banques disponibles pour un pays.
func (h *Handlers) GetInstitutions(w http.ResponseWriter, r *http.Request) {
	country := r.URL.Query().Get("country")
	if country == "" {
		country = "FR"
	}

	institutions, err := h.bank.GetInstitutions(r.Context(), country)
	if err != nil {
		slog.Error("Erreur liste institutions", "error", err, "country", country)
		writeError(w, http.StatusBadGateway, "BANKING_ERROR", "Impossible de récupérer la liste des banques")
		return
	}

	writeJSON(w, http.StatusOK, institutions)
}

// ─── Refresh Balances (Cron Job) ─────────────────────────

// RefreshBalances rafraîchit les soldes de tous les comptes actifs.
func (h *Handlers) RefreshBalances(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	// Récupérer toutes les connexions actives
	connections, err := h.repo.GetAllActiveBankConnections(ctx)
	if err != nil {
		slog.Error("Erreur récupération connexions actives", "error", err)
		writeError(w, http.StatusInternalServerError, "INTERNAL", "Erreur serveur")
		return
	}

	updated := 0
	failed := 0

	for _, conn := range connections {
		// Vérifier si le consentement est expiré
		if conn.ConsentExpiresAt != nil && conn.ConsentExpiresAt.Before(time.Now()) {
			_ = h.repo.UpdateBankConnectionStatus(ctx, conn.ID, "expired")
			continue
		}

		// Récupérer les comptes de cette connexion
		accounts, err := h.repo.GetBankAccountsByConnection(ctx, conn.ID)
		if err != nil {
			slog.Warn("Erreur récupération comptes", "error", err, "connectionID", conn.ID)
			failed++
			continue
		}

		for _, account := range accounts {
			balances, err := h.bank.GetAccountBalances(ctx, account.ProviderAccountID)
			if err != nil {
				slog.Warn("Erreur refresh solde", "error", err, "accountID", account.ProviderAccountID)
				failed++
				continue
			}

			if len(balances) > 0 {
				amount, cur := bestBalance(balances)
				if err := h.repo.UpsertBalance(ctx, account.ID, amount, cur); err != nil {
					failed++
				} else {
					updated++
				}
			}
		}
	}

	slog.Info("Refresh soldes terminé", "updated", updated, "failed", failed)
	writeJSON(w, http.StatusOK, map[string]interface{}{
		"updated": updated,
		"failed":  failed,
	})
}

// ─── Bank Callback ──────────────────────────────────────

// BankCallback reçoit le code + state d'Enable Banking après authentification PSU.
// Affiche une page HTML intermédiaire qui tente d'ouvrir le deep link de l'app.
// Fonctionne en développement (Expo Go) et en production (app native).
// Cette route est publique (pas d'auth Clerk) car appelée par le navigateur après redirect bancaire.
func (h *Handlers) BankCallback(w http.ResponseWriter, r *http.Request) {
	code := r.URL.Query().Get("code")
	state := r.URL.Query().Get("state")
	errParam := r.URL.Query().Get("error")

	if errParam != "" {
		pageWithMessage(w, "Connexion annulée", "La connexion bancaire a été annulée ou a échoué. Vous pouvez fermer cette page.")
		return
	}

	if code == "" || state == "" {
		pageWithMessage(w, "Paramètres manquants", "Paramètres code ou state manquants. Veuillez réessayer depuis l'application.")
		return
	}

	deepLink := fmt.Sprintf("wallet-balance-assistant://bank-callback?code=%s&state=%s",
		code, state)

	pageWithDeepLink(w, deepLink)
}

// pageWithDeepLink affiche une page HTML qui tente d'ouvrir le deep link iOS de l'app.
// Active à la fois l'ouverture automatique (JS) et un bouton de secours.
func pageWithDeepLink(w http.ResponseWriter, deepLink string) {
	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	w.WriteHeader(http.StatusOK)
	fmt.Fprintf(w, `<!DOCTYPE html>
<html><head>
<meta charset="utf-8">
<title>Retour vers l'application</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
  body{font-family:system-ui,-apple-system;display:flex;flex-direction:column;align-items:center;
       justify-content:center;min-height:100vh;margin:0;background:#0f0e17;color:#fff;text-align:center;padding:2rem}
  h1{font-size:1.3rem;margin-bottom:.5rem}
  p{color:#a0a0b0;font-size:.95rem;max-width:320px;margin-bottom:2rem}
  a{display:inline-block;padding:.9rem 2rem;background:#6366f1;color:#fff;border-radius:12px;
    text-decoration:none;font-weight:600;font-size:1rem}
  a:active{opacity:.8}
  .sub{margin-top:1.5rem;font-size:.8rem;color:#555}
</style>
</head><body>
<h1>✅ Authentification réussie</h1>
<p>Retournez dans l'application pour finaliser la connexion bancaire.</p>
<a href="%s">Ouvrir l'application</a>
<p class="sub">Si le bouton ne fonctionne pas, rouvrez manuellement l'application.</p>
<script>
  // Tentative d'ouverture automatique après 300ms
  setTimeout(function(){ window.location.href = "%s"; }, 300);
</script>
</body></html>`, deepLink, deepLink)
}

// pageWithMessage affiche une page HTML simple pour les erreurs de callback.
func pageWithMessage(w http.ResponseWriter, title, message string) {
	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	w.WriteHeader(http.StatusOK)
	fmt.Fprintf(w, `<!DOCTYPE html><html><head><meta charset="utf-8"><title>%s</title>`+
		`<meta name="viewport" content="width=device-width, initial-scale=1">`+
		`<style>body{font-family:system-ui;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#f5f5f5}`+
		`h1{font-size:1.4rem;color:#1a1a1a}p{color:#555;text-align:center;max-width:360px}</style></head>`+
		`<body><h1>%s</h1><p>%s</p></body></html>`, title, title, message)
}

// ─── Health ──────────────────────────────────────────────

// HealthCheck retourne l'état du serveur.
func (h *Handlers) HealthCheck(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, map[string]string{
		"status":  "ok",
		"version": "1.0.0",
	})
}
