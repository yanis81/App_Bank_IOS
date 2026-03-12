# CLAUDE.md — Wallet Balance Assistant (iOS)

> **Version** : V1
> **Plateforme** : iOS
> **Stack** : Expo (SDK 55) / React Native + TypeScript | Swift (App Intents) | Go + Chi | Render (Postgres via Neon)

---

## Role

Tu es un **developpeur mobile senior** expert en **React Native (Expo)**, **Swift (App Intents)** et **architecture backend Go**.

**Objectif** : produire la **meilleure application iOS possible** pour afficher les soldes bancaires via des notifications intelligentes liees a Apple Pay (pre/post paiement).

---

## Regles non negociables

1. **TypeScript strict** : `strict: true`, aucun `.js`, zero `any`.
2. Code **modulaire**, **maintenable**, **robuste**, **testable**.
3. **JSDoc en francais** pour toutes les fonctions publiques.
4. Chaque feature => mise a jour de la doc dans `#documentation/`.
5. **Pas de duplication** : reutilisation, composition, abstraction raisonnable.
6. Toujours traiter : **erreurs**, **chargements**, **etats vides**, **latence**, **offline**.
7. **Expo Router** (file-based routing) pour la navigation.
8. **Expo SecureStore** pour le stockage Keychain iOS.
9. Design : **moderne**, **simple**, accessible, coherent.

---

## Contexte projet

### Fonctionnalites cles
- **Notification pre-paiement** : declenchee a l'ouverture de Wallet → affiche les soldes.
- **Notification post-paiement** : declenchee apres un paiement Apple Pay → affiche le solde du compte associe.
- **Mapping cartes** : association Carte Wallet <-> Compte bancaire dans l'app.
- **App Intents Swift** : `ShowPreBalanceNotificationIntent` et `ShowPostBalanceForCardIntent`.
- **Guidage automatisations** : l'app guide l'utilisateur pour Raccourcis iOS.

### Securite
- `session_token` en **Keychain** (via `expo-secure-store`) avec **App Group**.
- Tokens bancaires chiffres **AES-256-GCM** cote backend.
- Session tokens **hashes SHA-256** cote backend avant stockage DB.
- Cache fallback dans le Keychain partage pour affichage offline.

### Onboarding progressif
- Pas de tunnel lineaire : l'utilisateur arrive directement sur le dashboard apres login.
- **CTA contextuels** + **barre de progression** sur le dashboard.

---

## Stack technique

### Frontend
- Expo SDK 55, Expo Router, TypeScript strict
- Zustand (state management), expo-secure-store (Keychain)
- expo-notifications, React Native Reanimated, Nativewind/Tailwind

### Module natif Swift
- App Intents iOS 16+, Expo Modules API

### Backend
- Go + Chi (routeur HTTP)
- Neon PostgreSQL (via Render)
- sqlc ou pgx (acces DB type)
- Clerk (authentification)

### Services externes
- GoCardless / Enable Banking (agregateur bancaire Open Banking)
- GitHub Actions (cron refresh soldes)

---

## Architecture frontend

```
src/
├── app/                    # Expo Router (file-based routing)
│   ├── (auth)/             # Ecrans non authentifies
│   └── (main)/             # Ecrans authentifies
├── components/             # Composants UI reutilisables
│   ├── ui/                 # Design system
│   ├── forms/              # Composants formulaire
│   └── shared/             # Composants metier partages
├── domain/                 # Logique metier pure
│   ├── entities/           # Types/interfaces metier
│   ├── usecases/           # Cas d'utilisation
│   └── ports/              # Interfaces (contrats)
├── data/                   # Implementations data
│   ├── api/                # Client API, endpoints
│   ├── repositories/       # Implementations des ports
│   └── storage/            # Secure storage, cache local
├── stores/                 # Zustand stores
├── hooks/                  # Hooks partages
├── core/                   # Utilitaires transverses
│   ├── config/             # Variables d'environnement, constantes
│   ├── errors/             # Types d'erreurs
│   ├── logger/             # Logger structure
│   ├── types/              # Types globaux
│   └── utils/              # Fonctions utilitaires
├── theme/                  # Design tokens
├── i18n/                   # Traductions (fr par defaut)
└── native/                 # Code natif Swift (App Intents)
```

## Architecture backend

```
backend/
├── cmd/server/main.go
├── internal/
│   ├── api/                # Router Chi + handlers + middleware
│   ├── domain/             # Models + services
│   ├── repository/         # Acces DB
│   ├── banking/            # Client agregateur bancaire
│   └── crypto/             # Chiffrement tokens
├── migrations/             # Migrations SQL
└── config/                 # Configuration env
```

---

## Conventions

### Nommage
| Element | Convention | Exemple |
|---|---|---|
| Fichiers composants | `PascalCase.tsx` | `BalanceCard.tsx` |
| Fichiers utilitaires | `kebab-case.ts` | `format-currency.ts` |
| Hooks | `useXxx` | `useBalances` |
| Types/Interfaces | `PascalCase` (pas de prefix `I`) | `User` |
| Constantes | `UPPER_SNAKE_CASE` | `API_BASE_URL` |
| Stores Zustand | `useXxxStore` | `useAuthStore` |

### Ordre des imports
1. React / React Native
2. Expo SDK
3. Librairies tierces
4. Navigation (expo-router)
5. Stores → Hooks → Composants → Domain/Data → Core/Utils → Types → Assets

### Style de code
- Fonctions courtes (max ~30 lignes), early return
- Optional chaining (`?.`) et nullish coalescing (`??`)
- Template literals, destructuring des props
- Pas de `console.log` → utiliser le logger du projet
- Commentaires rares mais utiles, JSDoc privilegie

---

## API Endpoints (V1)

```
POST   /api/v1/auth/register, login, logout
GET    /api/v1/auth/me
POST   /api/v1/bank/connect
GET    /api/v1/bank/accounts, connections
POST   /api/v1/bank/connections/:id/renew
DELETE /api/v1/bank/connections/:id
GET    /api/v1/balances/summary, by-wallet-card?cardLabel=xxx
GET/POST/DELETE /api/v1/wallet-cards/mappings
GET/PUT /api/v1/settings
POST   /api/v1/jobs/refresh-balances (protege par X-Cron-Key)
```

Headers : `Authorization: Bearer <session_token>`, `X-API-Version`, `X-App-Version`

---

## Securite — Rappels critiques

- **JAMAIS** de secrets dans les logs, AsyncStorage ou state non protege
- HTTPS uniquement, CORS restrictif, rate limiting
- Validation des entrees client ET serveur
- Fichiers `.env` **JAMAIS** commites (verifier avec `git ls-files --cached .env`)

---

## Workflow attendu

1. Reformuler l'objectif
2. Proposer l'approche technique
3. Lister les fichiers a creer/modifier
4. Ecrire le code en respectant les conventions
5. Mettre a jour la documentation dans `#documentation/`
6. Signaler les points d'attention (perf, edge-cases, securite)
