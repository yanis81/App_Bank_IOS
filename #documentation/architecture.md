# Architecture — Wallet Balance Assistant

## Vue d'ensemble

L'application suit une **Clean Architecture adaptée** avec 3 grandes couches :

```
┌──────────────────────────────────────────┐
│           PRÉSENTATION (UI)              │
│  Expo Router, Composants, Hooks UI       │
├──────────────────────────────────────────┤
│           DOMAINE (Métier)               │
│  Entités, Use Cases, Ports (interfaces)  │
├──────────────────────────────────────────┤
│           DONNÉES (Infra)                │
│  API Client, Repositories, Storage       │
└──────────────────────────────────────────┘
```

---

## Frontend (React Native / Expo)

### Couches

| Couche | Rôle | Dépendances |
|---|---|---|
| `app/` | Écrans, navigation (Expo Router) | Stores, Hooks, Components |
| `components/` | UI réutilisable | Theme uniquement |
| `stores/` | State management (Zustand) | Data layer |
| `hooks/` | Logique UI partagée | Stores |
| `domain/` | Types métier + interfaces | Aucune |
| `data/` | Implémentations (API, storage) | Domain ports |
| `core/` | Transverse (config, errors, logger) | Aucune |
| `theme/` | Design tokens (couleurs, spacing...) | Aucune |

### Règle de dépendance
- Le domaine ne dépend de rien (types purs).
- La data implémente les ports du domaine.
- La présentation utilise les stores qui consomment la data.

### Patterns transverses
- **Cache fallback** : le store `bank-store` cache les derniers soldes dans le Keychain partagé (via `shared-cache.ts`). En cas d'échec réseau, les données cachées sont retournées.
- **Onboarding progressif** : pas de tunnel linéaire. Le hook `useOnboardingProgress` calcule les étapes restantes et affiche des CTA contextuels sur le dashboard.
- **Privacy mode** : les montants sont masqués (`••••••`) dans la UI et les notifications quand `privacyMode = true`.
- **Versioning API** : headers `X-API-Version` et `X-App-Version` envoyés à chaque requête pour gérer la compatibilité et le force-update.

---

## Backend (Go + Chi)

```
backend/
├── cmd/server/          → Point d'entrée
├── internal/
│   ├── api/             → Router Chi, handlers, middleware (Clerk JWT)
│   ├── domain/          → Modèles, services
│   ├── repository/      → Accès DB (Neon PostgreSQL serverless)
│   ├── banking/         → Client Enable Banking (JWT RS256 + REST API)
│   └── crypto/          → Chiffrement AES-256-GCM des tokens bancaires
├── migrations/          → SQL (déployées sur Neon)
└── config/              → Env vars (PORT, DATABASE_URL, CLERK_SECRET_KEY, ENABLE_BANKING_*)
```

### Authentification
- **Clerk** gère l'auth complètement (inscription, connexion, JWT).
- Le middleware `ClerkAuth` vérifie le JWT Clerk, extrait le `Subject` (clerk_user_id), et upsert l'utilisateur en DB.
- Les endpoints sont protégés par `Authorization: Bearer <clerk_jwt>`.

### Enable Banking (ex-GoCardless)
- Client REST implémenté dans `internal/banking/client.go`.
- Auth : **JWT RS256** généré localement avec clé RSA privée (Application ID + clé PEM).
- Flow PSU : `POST /auth` → redirect banque → callback `?code=&state=` → `POST /sessions` → comptes + soldes.
- No token caching needed : JWT généré à la volée (~1ms) pour chaque requête.
- Sessions valides 90 jours (configurable via `access.valid_until`).

---

## Module natif Swift

Situé dans `modules/wallet-bridge/`, le module natif Swift est enregistré via **Expo Modules API** :

### WalletBridgeModule (bridge React Native ↔ Swift)
- `setCachedBalances(json)` / `getCachedBalances()` : cache des soldes dans App Group UserDefaults.
- `setSharedToken(token)` / `getSharedToken()` / `deleteSharedToken()` : gestion du token Clerk dans le Keychain partagé.
- `isAvailable()` : vérifie si le module est opérationnel.

### App Intents (iOS 16+)
- `ShowPreBalanceNotificationIntent` : récupère les 3 soldes configurés depuis le cache App Group et affiche une notification locale.
- `ShowPostBalanceForCardIntent(cardLabel)` : récupère le solde du compte mappé à la carte Wallet et affiche une notification.

Les Intents lisent le cache App Group pour une notification **< 1 seconde**, puis tentent un refresh API en arrière-plan.

---

## Flux de données

```
[App Intent Swift] → [Cache App Group] → Notification (< 1s)
         │                                  │
         └────→ [API Backend Go] → [Neon PostgreSQL]
                      │
                Clerk JWT validé + soldes retournés
                      │
              [Mise à jour cache App Group]
```

**Stratégie notification < 1s** : les App Intents lisent d'abord le cache Keychain pour afficher une notification immédiate, puis tentent un refresh API en arrière-plan.

---

## Infra V1

| Service | Provider | Tier |
|---|---|---|
| API | Render ou Fly.io | Free |
| Database | Neon (PostgreSQL serverless) | Free (0.5 GB) |
| Auth | Clerk | Free (10k MAU) |
| Cron | GitHub Actions | Free |
| Open Banking | Enable Banking | Free (developer tier) |
