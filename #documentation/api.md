# API Backend — Wallet Balance Assistant

## Base URL
```
Production : https://<api-domain>/api/v1
Développement : http://localhost:8080/api/v1
```

## Authentification
Toutes les routes (sauf register/login) requièrent :
```
Authorization: Bearer <session_token>
```

Les routes cron requièrent :
```
X-Cron-Key: <secret>
```

## Headers requis (toutes les requêtes)
| Header | Valeur | Description |
|---|---|---|
| `X-API-Version` | `1.0.0` | Version du contrat API client |
| `X-App-Version` | `1.0.0` | Version de l'application (force update) |
| `Authorization` | `Bearer <token>` | Session token (sauf register/login) |
| `X-Cron-Key` | `<secret>` | Uniquement pour les endpoints jobs |

---

## Endpoints

### Auth

#### POST /auth/register
Inscription d'un nouvel utilisateur.

**Body :**
```json
{ "email": "user@example.com", "password": "••••••••" }
```

**Réponse (201) :**
```json
{
  "success": true,
  "data": {
    "user": { "id": "uuid", "email": "user@example.com", "createdAt": "..." },
    "sessionToken": "uuid-v4"
  }
}
```

#### POST /auth/login
Connexion utilisateur.

**Body :** identique à register.  
**Réponse (200) :** identique à register.

#### POST /auth/logout
Déconnexion (invalide le token).

**Réponse (200) :**
```json
{ "success": true, "data": null }
```

#### GET /auth/me
Infos utilisateur courant.

**Réponse (200) :**
```json
{
  "success": true,
  "data": { "id": "uuid", "email": "user@example.com", "createdAt": "..." }
}
```

---

### Bank

#### POST /bank/connect
Initie une connexion Open Banking.

**Réponse (200) :**
```json
{ "success": true, "data": { "redirectUrl": "https://gocardless.com/..." } }
```

#### GET /bank/accounts
Liste des comptes bancaires.

**Réponse (200) :**
```json
{
  "success": true,
  "data": [
    { "id": "uuid", "label": "Compte courant", "maskedIban": "FR76 •••• 1234", "currency": "EUR" }
  ]
}
```

#### GET /bank/connections
Liste les connexions bancaires avec statut et expiration du consentement.

**Réponse (200) :**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "provider": "gocardless",
      "status": "active",
      "consentExpiresAt": "2026-06-01T00:00:00Z",
      "createdAt": "..."
    }
  ]
}
```

#### POST /bank/connections/:id/renew
Renouvelle le consentement PSD2 pour une connexion bancaire.

**Réponse (200) :**
```json
{ "success": true, "data": { "redirectUrl": "https://gocardless.com/..." } }
```

#### DELETE /bank/connections/:id
Supprime une connexion bancaire.

---

### Balances

#### GET /balances/summary
Résumé des soldes (notification pré-paiement, 3 comptes max).

**Réponse (200) :**
```json
{
  "success": true,
  "data": {
    "accounts": [
      { "label": "Compte courant", "amount": 1234.56, "currency": "EUR" },
      { "label": "Livret A", "amount": 5678.90, "currency": "EUR" }
    ],
    "lastUpdated": "2026-03-04T10:30:00Z"
  }
}
```

#### GET /balances/by-wallet-card?cardLabel=xxx
Solde par carte Wallet (notification post-paiement).

**Réponse (200) :**
```json
{
  "success": true,
  "data": {
    "accountLabel": "Compte courant",
    "amount": 1234.56,
    "currency": "EUR",
    "lastUpdated": "2026-03-04T10:30:00Z"
  }
}
```

---

### Wallet Card Mappings

#### GET /wallet-cards/mappings
Liste les mappings carte Wallet ↔ compte.

#### POST /wallet-cards/mappings
Crée/met à jour un mapping.

**Body :**
```json
{ "walletCardLabel": "Boursobank Visa", "accountId": "uuid" }
```

#### DELETE /wallet-cards/mappings/:id
Supprime un mapping.

---

### Settings

#### GET /settings
Récupère les réglages de notification.

#### PUT /settings
Met à jour les réglages.

**Body :**
```json
{
  "primaryAccountId": "uuid",
  "secondaryAccount1Id": "uuid",
  "secondaryAccount2Id": null,
  "refreshPerDay": 3,
  "privacyMode": false
}
```

---

### Jobs

#### POST /jobs/refresh-balances
Rafraîchit les soldes de tous les utilisateurs (appelé par GitHub Actions cron).

**Headers :** `X-Cron-Key: <secret>`

---

## Réponses d'erreur

```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Session expirée"
  }
}
```

| Code HTTP | ErrorCode | Description |
|---|---|---|
| 401 | UNAUTHORIZED | Token invalide ou expiré |
| 422 | VALIDATION | Données invalides |
| 404 | NOT_FOUND | Ressource non trouvée |
| 409 | BANK_CONSENT_EXPIRING | Consentement bancaire bientôt expiré |
| 426 | UPDATE_REQUIRED | Mise à jour de l'app requise |
| 500 | SERVER | Erreur serveur |
