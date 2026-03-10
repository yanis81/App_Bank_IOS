# API Backend — Wallet Balance Assistant

## Base URL
```
Production : https://<api-domain>/api/v1
Développement : http://localhost:8080/api/v1
```

## Authentification
Toutes les routes (sauf health) requèrent un JWT Clerk :
```
Authorization: Bearer <clerk_jwt>
```

L'authentification (inscription/connexion) est entièrement gérée par **Clerk** côté frontend.
Le backend vérifie le JWT et upsert l'utilisateur automatiquement.

Les routes cron requèrent :
```
X-Cron-Key: <secret>
```

## Headers requis (toutes les requêtes)
| Header | Valeur | Description |
|---|---|---|
| `X-API-Version` | `1.0.0` | Version du contrat API client |
| `X-App-Version` | `1.0.0` | Version de l'application (force update) |
| `Authorization` | `Bearer <clerk_jwt>` | JWT Clerk (sauf health/cron) |
| `X-Cron-Key` | `<secret>` | Uniquement pour les endpoints jobs |

---

## Endpoints

### Auth

#### GET /auth/me
Infos utilisateur courant (créé automatiquement au premier appel via le middleware Clerk).

**Réponse (200) :**
```json
{
  "success": true,
  "data": { "id": "uuid", "clerkUserId": "user_xxx", "email": "user@example.com", "createdAt": "..." }
}
```

---

### Bank

#### GET /bank/institutions?country=FR
Liste des banques disponibles pour un pays (via Enable Banking — code ISO 3166).

**Réponse (200) :**
```json
{
  "success": true,
  "data": [
    { "name": "Boursorama", "country": "FR", "bic": "BOUSFRPP", "logo": "https://..." }
  ]
}
```

#### POST /bank/connect
Initie une connexion Open Banking via Enable Banking.

**Body :**
```json
{ "aspspName": "Boursorama", "aspspCountry": "FR" }
```

**Réponse (200) :**
```json
{ "success": true, "data": { "link": "https://enablebanking.com/auth/...", "state": "uuid" } }
```

#### GET /bank/connect/complete?code=xxx&state=yyy
Finalise la connexion après retour de la banque. Échange le code OAuth2 contre une session Enable Banking, importe les comptes et les soldes initiaux.

**Réponse (200) :**
```json
{ "success": true, "data": { "status": "connected", "accountsImported": 2 } }
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
      "provider": "enablebanking",
      "status": "active",
      "consentExpiresAt": "2026-06-01T00:00:00Z",
      "createdAt": "..."
    }
  ]
}
```

#### POST /bank/connections/:id/renew
Renouvelle le consentement PSD2 pour une connexion bancaire.

**Body :**
```json
{ "aspspName": "Boursorama", "aspspCountry": "FR" }
```

**Réponse (200) :**
```json
{ "success": true, "data": { "link": "https://enablebanking.com/auth/...", "state": "uuid" } }
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
| 401 | UNAUTHORIZED | JWT Clerk invalide ou expiré |
| 422 | VALIDATION | Données invalides |
| 404 | NOT_FOUND | Ressource non trouvée |
| 409 | BANK_CONSENT_EXPIRING | Consentement bancaire bientôt expiré |
| 426 | UPDATE_REQUIRED | Mise à jour de l'app requise |
| 500 | SERVER | Erreur serveur |
