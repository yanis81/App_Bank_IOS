package banking

import (
	"bytes"
	"context"
	"crypto"
	"crypto/rand"
	"crypto/rsa"
	"crypto/sha256"
	"crypto/x509"
	"encoding/base64"
	"encoding/json"
	"encoding/pem"
	"fmt"
	"io"
	"net/http"
	"time"
)

const baseURL = "https://api.enablebanking.com"

// Client est le client pour l'API Enable Banking.
type Client struct {
	httpClient *http.Client
	appID      string
	privateKey *rsa.PrivateKey
}

// New crée un nouveau client Enable Banking.
// appID est l'UUID de l'application (kid dans le JWT).
// privateKeyPEM est la clé RSA privée au format PEM (PKCS8 ou PKCS1).
func New(appID, privateKeyPEM string) (*Client, error) {
	key, err := parseRSAPrivateKey(privateKeyPEM)
	if err != nil {
		return nil, fmt.Errorf("parsing clé RSA Enable Banking: %w", err)
	}
	return &Client{
		httpClient: &http.Client{Timeout: 15 * time.Second},
		appID:      appID,
		privateKey: key,
	}, nil
}

// parseRSAPrivateKey parse une clé RSA privée depuis son format PEM (PKCS8 puis PKCS1).
func parseRSAPrivateKey(pemStr string) (*rsa.PrivateKey, error) {
	block, _ := pem.Decode([]byte(pemStr))
	if block == nil {
		return nil, fmt.Errorf("impossible de décoder le bloc PEM")
	}
	// Tentative PKCS8 en premier
	if key, err := x509.ParsePKCS8PrivateKey(block.Bytes); err == nil {
		rsaKey, ok := key.(*rsa.PrivateKey)
		if !ok {
			return nil, fmt.Errorf("la clé PEM n'est pas de type RSA")
		}
		return rsaKey, nil
	}
	// Fallback PKCS1
	rsaKey, err := x509.ParsePKCS1PrivateKey(block.Bytes)
	if err != nil {
		return nil, fmt.Errorf("impossible de parser la clé RSA (PKCS8 et PKCS1 échoués): %w", err)
	}
	return rsaKey, nil
}

// ─── Types API Enable Banking ────────────────────────────

// Institution représente une banque disponible (ASPSP).
type Institution struct {
	Name    string `json:"name"`
	Country string `json:"country"`
	BIC     string `json:"bic"`
	Logo    string `json:"logo"`
}

// SessionAccountID représente les identifiants d'un compte (IBAN ou autre).
type SessionAccountID struct {
	IBAN string `json:"iban"`
}

// SessionAccount représente un compte autorisé dans une session PSU.
type SessionAccount struct {
	AccountID SessionAccountID `json:"account_id"`
	Name      string           `json:"name"`
	Currency  string           `json:"currency"`
	UID       string           `json:"uid"`
}

// Session représente une session utilisateur Enable Banking.
type Session struct {
	SessionID string           `json:"session_id"`
	Accounts  []SessionAccount `json:"accounts"`
	Access    struct {
		ValidUntil string `json:"valid_until"`
	} `json:"access"`
}

// BalanceAmount représente un montant avec devise (snake_case Enable Banking).
type BalanceAmount struct {
	Amount   string `json:"amount"`
	Currency string `json:"currency"`
}

// BalanceItem représente un solde de compte (ISO 20022).
// Les types de solde principaux : ITAV (interim available), CLAV (closing available),
// ITBD (interim booked), CLBD (closing booked).
type BalanceItem struct {
	Name          string        `json:"name"`
	BalanceAmount BalanceAmount `json:"balance_amount"`
	BalanceType   string        `json:"balance_type"`
}

// BalancesResponse est la réponse de l'API pour les soldes.
type BalancesResponse struct {
	Balances []BalanceItem `json:"balances"`
}

// InstitutionsResponse est la réponse de l'API pour la liste des ASPSP.
type InstitutionsResponse struct {
	ASPSPs []Institution `json:"aspsps"`
}

// ─── JWT RS256 ───────────────────────────────────────────

// generateJWT génère un JWT RS256 signé pour l'authentification Enable Banking.
// Utilise uniquement la bibliothèque standard Go (pas de dépendance externe).
func (c *Client) generateJWT() (string, error) {
	now := time.Now()

	header := map[string]interface{}{
		"alg": "RS256",
		"typ": "JWT",
		"kid": c.appID,
	}
	payload := map[string]interface{}{
		"iss": "enablebanking.com",
		"aud": "api.enablebanking.com",
		"iat": now.Unix(),
		"exp": now.Add(time.Hour).Unix(),
		"kid": c.appID,
	}

	headerJSON, err := json.Marshal(header)
	if err != nil {
		return "", fmt.Errorf("marshal JWT header: %w", err)
	}
	payloadJSON, err := json.Marshal(payload)
	if err != nil {
		return "", fmt.Errorf("marshal JWT payload: %w", err)
	}

	signingInput := base64.RawURLEncoding.EncodeToString(headerJSON) + "." +
		base64.RawURLEncoding.EncodeToString(payloadJSON)

	digest := sha256.Sum256([]byte(signingInput))
	signature, err := rsa.SignPKCS1v15(rand.Reader, c.privateKey, crypto.SHA256, digest[:])
	if err != nil {
		return "", fmt.Errorf("signature JWT RS256: %w", err)
	}

	return signingInput + "." + base64.RawURLEncoding.EncodeToString(signature), nil
}

// ─── Institutions ────────────────────────────────────────

// GetInstitutions liste les banques disponibles pour un pays (code ISO 3166).
func (c *Client) GetInstitutions(ctx context.Context, countryCode string) ([]Institution, error) {
	resp, err := c.doRequest(ctx, http.MethodGet, "/aspsps?country="+countryCode, nil)
	if err != nil {
		return nil, fmt.Errorf("list institutions: %w", err)
	}

	var result InstitutionsResponse
	if err := json.Unmarshal(resp, &result); err != nil {
		return nil, fmt.Errorf("parsing institutions: %w", err)
	}
	return result.ASPSPs, nil
}

// ─── Authorization ───────────────────────────────────────

// InitAuth initie le flow d'autorisation PSU pour une banque.
// Retourne l'URL de redirection vers laquelle envoyer l'utilisateur.
// state doit être un UUID v4 généré aléatoirement pour chaque demande.
func (c *Client) InitAuth(ctx context.Context, aspspName, aspspCountry, redirectURL, state string) (string, error) {
	validUntil := time.Now().UTC().Add(90 * 24 * time.Hour).Format(time.RFC3339)
	body, _ := json.Marshal(map[string]interface{}{
		"access":       map[string]string{"valid_until": validUntil},
		"aspsp":        map[string]string{"name": aspspName, "country": aspspCountry},
		"state":        state,
		"redirect_url": redirectURL,
		"psu_type":     "personal",
	})

	resp, err := c.doRequest(ctx, http.MethodPost, "/auth", body)
	if err != nil {
		return "", fmt.Errorf("init auth Enable Banking: %w", err)
	}

	var authResp struct {
		URL string `json:"url"`
	}
	if err := json.Unmarshal(resp, &authResp); err != nil {
		return "", fmt.Errorf("parsing auth response: %w", err)
	}
	return authResp.URL, nil
}

// ─── Sessions ────────────────────────────────────────────

// CreateSession échange le code d'autorisation (reçu en callback) contre une session PSU.
// Retourne la session contenant le session_id et la liste des comptes autorisés.
func (c *Client) CreateSession(ctx context.Context, code string) (*Session, error) {
	body, _ := json.Marshal(map[string]string{"code": code})

	resp, err := c.doRequest(ctx, http.MethodPost, "/sessions", body)
	if err != nil {
		return nil, fmt.Errorf("create session Enable Banking: %w", err)
	}

	var session Session
	if err := json.Unmarshal(resp, &session); err != nil {
		return nil, fmt.Errorf("parsing session: %w", err)
	}
	return &session, nil
}

// DeleteSession révoque une session PSU (équivalent au logout bancaire côté utilisateur).
func (c *Client) DeleteSession(ctx context.Context, sessionID string) error {
	_, err := c.doRequest(ctx, http.MethodDelete, "/sessions/"+sessionID, nil)
	if err != nil {
		return fmt.Errorf("delete session Enable Banking: %w", err)
	}
	return nil
}

// ─── Accounts ────────────────────────────────────────────

// GetAccountBalances récupère les soldes d'un compte via son UID Enable Banking.
// Les types de solde ISO 20022 retournés varient selon la banque.
func (c *Client) GetAccountBalances(ctx context.Context, accountUID string) ([]BalanceItem, error) {
	resp, err := c.doRequest(ctx, http.MethodGet, "/accounts/"+accountUID+"/balances", nil)
	if err != nil {
		return nil, fmt.Errorf("get account balances: %w", err)
	}

	var balancesResp BalancesResponse
	if err := json.Unmarshal(resp, &balancesResp); err != nil {
		return nil, fmt.Errorf("parsing balances: %w", err)
	}
	return balancesResp.Balances, nil
}

// ─── HTTP Helper ─────────────────────────────────────────

// doRequest exécute une requête HTTP authentifiée vers l'API Enable Banking.
// Un JWT RS256 frais est généré pour chaque requête.
func (c *Client) doRequest(ctx context.Context, method, path string, body []byte) ([]byte, error) {
	jwtToken, err := c.generateJWT()
	if err != nil {
		return nil, fmt.Errorf("génération JWT: %w", err)
	}

	var bodyReader io.Reader
	if body != nil {
		bodyReader = bytes.NewReader(body)
	}

	req, err := http.NewRequestWithContext(ctx, method, baseURL+path, bodyReader)
	if err != nil {
		return nil, fmt.Errorf("création requête: %w", err)
	}

	req.Header.Set("Accept", "application/json")
	req.Header.Set("Authorization", "Bearer "+jwtToken)
	if body != nil {
		req.Header.Set("Content-Type", "application/json")
	}

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("requête HTTP: %w", err)
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("lecture réponse: %w", err)
	}

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return nil, fmt.Errorf("Enable Banking API erreur %d: %s", resp.StatusCode, string(respBody))
	}

	return respBody, nil
}
