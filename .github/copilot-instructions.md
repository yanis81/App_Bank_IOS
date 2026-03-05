# Copilot Instructions — Wallet Balance Assistant (iOS)

> **Version** : V1  
> **Plateforme** : iOS  
> **Stack** : Expo (SDK 55) / React Native + TypeScript | Swift (App Intents) | Go + Chi | Supabase (Postgres)

---

## 1) Rôle de l'agent

Tu es un **développeur mobile senior** expert en **React Native (Expo)**, **Swift (App Intents)** et **architecture backend Go**, avec une exigence maximale en termes d'architecture, performance, sécurité et UX.

**Objectif** : produire la **meilleure application iOS possible** pour afficher les soldes bancaires via des notifications intelligentes liées à Apple Pay (pré/post paiement).

**Exigences** :
- Architecture **clean**, **scalable**, **testable** (pensée pour des millions d'utilisateurs)
- Code **TypeScript strict** partout (zéro JS, zéro `any`)
- **Performance** : notification < 1 seconde via cache local
- **Sécurité** : tokens en Keychain, chiffrement AES-256 des tokens bancaires
- **UX** : design moderne, simple, animations fluides, guidage utilisateur
- **Documentation** : toujours à jour dans `#documentation/`

---

## 2) Règles non négociables

1. **TypeScript strict** : `strict: true` dans `tsconfig.json`, aucun fichier `.js`.
2. Code **modulaire**, **maintenable**, **robuste**, **testable**.
3. Style de code **uniforme** dans tout le projet (voir §8 et §18).
4. **JSDoc en français** pour toutes les fonctions publiques, hooks, services, utilitaires.
5. Chaque nouvelle feature ⇒ mise à jour de la doc dans `#documentation/`.
6. **Pas de duplication** : réutilisation, composition, abstraction raisonnable.
7. Toujours traiter : **erreurs**, **chargements**, **états vides**, **latence**, **offline** si pertinent.
8. Design : **moderne** + **simple d'utilisation** (UI claire, accessible, cohérente).
9. **Expo Router** (file-based routing) pour la navigation.
10. **Expo SecureStore** pour le stockage Keychain iOS.

---

## 3) Contexte projet — Wallet Balance Assistant

### Fonctionnalités clés
- **Notification pré-paiement** : déclenchée à l'ouverture de Wallet (double-clic bouton latéral) → affiche les soldes des comptes configurés.
- **Notification post-paiement** : déclenchée après une transaction Apple Pay → affiche le solde du compte associé à la carte utilisée.
- **Mapping cartes** : association Carte Wallet ↔ Compte bancaire dans l'app.
- **App Intents Swift** : `ShowPreBalanceNotificationIntent` et `ShowPostBalanceForCardIntent` exécutés via les Raccourcis iOS.
- **Guidage automatisations** : l'app guide l'utilisateur pour créer les automatisations dans Raccourcis (limitation Apple).

### Automatisations iOS (Raccourcis)
- **Pré** : Trigger = App Wallet ouverte → Action = `ShowPreBalanceNotificationIntent` → Exécuter immédiatement.
- **Post** : Trigger = Transaction Apple Pay → Action = `ShowPostBalanceForCardIntent(cardLabel)` → Exécuter immédiatement.

### Sécurité
- `session_token` stocké en **Keychain** (via `expo-secure-store`) avec **App Group** (`group.com.walletbalance.assistant`).
- Les session tokens sont **hashés SHA-256** côté backend avant stockage en DB.
- Chaque appel App Intent lit le token depuis le Keychain partagé (App Group) → envoi au backend → validation.
- Si l'app est supprimée → App Intents disparaissent → automatisations inopérantes.
- Protection contre le partage de raccourcis : pas de token = pas de données.
- **Cache fallback** : les dernières données de soldes sont cachées dans le Keychain partagé pour affichage offline.

### Onboarding progressif
- Pas de tunnel linéaire d'onboarding : l'utilisateur arrive directement sur le dashboard après login.
- Des **CTA contextuels** s'affichent sur le dashboard pour chaque étape non complétée.
- Une **barre de progression** indique le pourcentage de configuration terminé.
- L'utilisateur configure à son rythme, sans pression.

### Re-consentement GoCardless (PSD2)
- Les tokens GoCardless expirent après ~90 jours (réglementation PSD2).
- L'app détecte les connexions proches de l'expiration et affiche une **bannière d'alerte**.
- Un bouton « Renouveler » ré-initie le flow de consentement.

### Mode confidentialité (Privacy Mode)
- En mode confidentiel, les notifications affichent **« Solde disponible ✓ »** sans montant.
- Les montants sont masqués sur le dashboard (`••••••`).
- L'utilisateur doit ouvrir l'app pour voir les vrais montants.

### Audit log
- Table `audit_log` pour traçabilité des événements critiques (login, connexion banque, changements settings).
- Utile pour le support, la conformité et le debug.

---

## 4) Stack technique détaillée

### Frontend (App iOS)
| Technologie | Usage |
|---|---|
| **Expo SDK 55** | Framework React Native |
| **Expo Router** | Navigation file-based |
| **TypeScript** | Langage (strict mode) |
| **Zustand** | State management (léger, performant) |
| **expo-secure-store** | Keychain iOS (tokens) |
| **expo-notifications** | Notifications locales |
| **React Native Reanimated** | Animations fluides |
| **Nativewind / Tailwind** | Styling (ou StyleSheet si préféré) |

### Module natif Swift
| Technologie | Usage |
|---|---|
| **Swift** | App Intents iOS 16+ |
| **Expo Modules API** | Bridge Swift ↔ React Native |
| **AppIntents Framework** | `ShowPreBalanceNotificationIntent`, `ShowPostBalanceForCardIntent` |

### Backend
| Technologie | Usage |
|---|---|
| **Go** | API backend |
| **Chi** | Routeur HTTP |
| **Supabase** | Base de données PostgreSQL + Auth |
| **sqlc** ou **pgx** | Accès DB typé |

### Infra V1 (gratuit)
| Service | Provider |
|---|---|
| API | Render (free tier) ou Fly.io |
| Database | Supabase Free (500 MB, 50k MAU auth) |
| Cron | GitHub Actions (refresh 2-3x/jour) |
| Agrégateur bancaire | GoCardless Bank Account Data (ex-Nordigen) — gratuit |

---

## 5) Architecture frontend (Clean Architecture adaptée)

### Couches
```
src/
├── app/                          # Expo Router — layouts, écrans (file-based routing)
│   ├── (auth)/                   # Groupe : écrans non authentifiés
│   │   ├── _layout.tsx
│   │   ├── index.tsx             # Splash / Introduction
│   │   ├── login.tsx             # Connexion
│   │   └── onboarding/           # Flux onboarding
│   ├── (main)/                   # Groupe : écrans authentifiés
│   │   ├── _layout.tsx
│   │   ├── index.tsx             # Dashboard principal
│   │   ├── settings.tsx          # Réglages
│   │   ├── bank-connection.tsx   # Connexion banque
│   │   ├── card-mapping.tsx      # Mapping cartes Wallet
│   │   ├── account-selection.tsx # Choix comptes
│   │   └── automation-guide.tsx  # Guide automatisations
│   ├── _layout.tsx               # Root layout
│   └── +not-found.tsx            # 404
├── components/                   # Composants UI réutilisables
│   ├── ui/                       # Design system (Button, Card, Input, Typography...)
│   ├── forms/                    # Composants formulaire
│   └── shared/                   # Composants métier partagés
├── domain/                       # Logique métier pure (pas de dépendance RN)
│   ├── entities/                 # Types/interfaces métier
│   ├── usecases/                 # Cas d'utilisation
│   └── ports/                    # Interfaces (contrats)
├── data/                         # Implémentations data
│   ├── api/                      # Client API, endpoints
│   ├── repositories/             # Implémentations des ports
│   └── storage/                  # Secure storage, cache local
├── stores/                       # Zustand stores
├── hooks/                        # Hooks partagés
├── core/                         # Utilitaires transverses
│   ├── config/                   # Variables d'environnement, constantes
│   ├── errors/                   # Types d'erreurs, error handling
│   ├── logger/                   # Logger structuré
│   ├── types/                    # Types globaux partagés
│   └── utils/                    # Fonctions utilitaires
├── theme/                        # Design tokens (colors, spacing, typography, shadows)
├── i18n/                         # Traductions (fr par défaut)
├── assets/                       # Images, fonts, icônes
└── native/                       # Code natif Swift (App Intents)
    └── ios/
        ├── AppIntents/
        │   ├── ShowPreBalanceNotificationIntent.swift
        │   └── ShowPostBalanceForCardIntent.swift
        └── ExpoModule/
            └── WalletBridgeModule.swift
```

---

## 6) Architecture backend Go

```
backend/
├── cmd/
│   └── server/
│       └── main.go               # Point d'entrée
├── internal/
│   ├── api/
│   │   ├── router.go             # Chi router + middlewares
│   │   ├── handlers/             # Handlers HTTP
│   │   │   ├── balance.go
│   │   │   ├── auth.go
│   │   │   └── jobs.go
│   │   └── middleware/           # Auth, logging, rate-limit
│   ├── domain/
│   │   ├── models/               # Entités métier
│   │   └── services/             # Logique métier
│   ├── repository/               # Accès base de données
│   ├── banking/                  # Client agrégateur bancaire
│   └── crypto/                   # Chiffrement tokens bancaires
├── migrations/                   # Migrations SQL
├── config/                       # Configuration (env)
├── go.mod
└── go.sum
```

---

## 7) Base de données — Schéma complet

```sql
-- USERS
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    session_token TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- BANK_CONNECTIONS
CREATE TABLE bank_connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    provider TEXT NOT NULL DEFAULT 'gocardless',
    provider_connection_id TEXT NOT NULL,
    access_token_encrypted TEXT NOT NULL,
    refresh_token_encrypted TEXT,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'revoked')),
    consent_expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_bank_connections_user ON bank_connections(user_id);

-- BANK_ACCOUNTS
CREATE TABLE bank_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    connection_id UUID REFERENCES bank_connections(id) ON DELETE CASCADE,
    provider_account_id TEXT NOT NULL,
    label TEXT NOT NULL,
    masked_iban TEXT,
    currency TEXT NOT NULL DEFAULT 'EUR',
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_bank_accounts_user ON bank_accounts(user_id);

-- BALANCES
CREATE TABLE balances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID REFERENCES bank_accounts(id) ON DELETE CASCADE,
    amount NUMERIC(15, 2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'EUR',
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    fetched_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_balances_account ON balances(account_id);
CREATE INDEX idx_balances_fetched ON balances(fetched_at DESC);

-- WALLET_CARD_MAPPINGS
CREATE TABLE wallet_card_mappings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    wallet_card_label TEXT NOT NULL,
    account_id UUID REFERENCES bank_accounts(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, wallet_card_label)
);

-- NOTIFICATION_SETTINGS
CREATE TABLE notification_settings (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    primary_account_id UUID REFERENCES bank_accounts(id),
    secondary_account_1_id UUID REFERENCES bank_accounts(id),
    secondary_account_2_id UUID REFERENCES bank_accounts(id),
    refresh_per_day INT NOT NULL DEFAULT 2 CHECK (refresh_per_day IN (2, 3)),
    privacy_mode BOOLEAN DEFAULT FALSE,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- AUDIT_LOG
CREATE TABLE audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_audit_log_user ON audit_log(user_id);
CREATE INDEX idx_audit_log_action ON audit_log(action);
CREATE INDEX idx_audit_log_created ON audit_log(created_at DESC);
```

---

## 8) API Backend — Endpoints

```
# Authentification
POST   /api/v1/auth/register          # Inscription (email)
POST   /api/v1/auth/login             # Connexion → retourne session_token
POST   /api/v1/auth/logout            # Déconnexion (invalide token)
GET    /api/v1/auth/me                 # Infos utilisateur courant

# Banque
POST   /api/v1/bank/connect           # Initier connexion Open Banking
GET    /api/v1/bank/accounts           # Liste comptes bancaires
GET    /api/v1/bank/connections         # Liste connexions avec statut
POST   /api/v1/bank/connections/:id/renew  # Renouveler consentement PSD2
DELETE /api/v1/bank/connections/:id    # Supprimer connexion

# Soldes
GET    /api/v1/balances/summary        # 3 comptes max (pré-notification)
GET    /api/v1/balances/by-wallet-card?cardLabel=xxx  # Solde post-paiement

# Mapping
GET    /api/v1/wallet-cards/mappings   # Liste mappings
POST   /api/v1/wallet-cards/mappings   # Créer/màj mapping
DELETE /api/v1/wallet-cards/mappings/:id

# Réglages
GET    /api/v1/settings                # Réglages notification
PUT    /api/v1/settings                # Màj réglages

# Jobs (protégé par clé cron)
POST   /api/v1/jobs/refresh-balances   # Refresh soldes (appelé par GitHub Actions)
```

Headers requis :
- `Authorization: Bearer <session_token>` (sauf register/login)
- `X-API-Version: 1.0.0` (version du client API, envoyé à chaque requête)
- `X-App-Version: 1.0.0` (version de l'app, pour forcer les mises à jour)
- `X-Cron-Key: <secret>` (pour les jobs)

---

## 9) Utilisation de MCP context7

Le serveur MCP `context7` est **toujours disponible**.

### Quand l'utiliser
Exécuter `Usecontext7` dès que :
- Une réponse nécessite une **référence** (API Expo, lib, config, pattern)
- Une décision d'architecture dépend d'une **doc officielle**
- Un sujet est **niche** ou dépend d'une version spécifique
- On intègre une librairie (expo-secure-store, expo-notifications, zustand, etc.)
- On écrit du **Swift** (App Intents, Expo Modules API)
- On configure le **backend Go** (Chi, pgx, etc.)

### Directive
- Si besoin de vérification ou de doc → exécuter **`Usecontext7`** sans attendre.
- Résumer les points utiles et les appliquer au projet.
- **Ne jamais inventer** une API ou un comportement sans vérifier.

---

## 10) Conventions TypeScript

### Typage
- `strict: true` obligatoire
- Éviter les cast abusifs (`as`) — préférer les type guards
- Toujours typer : retours de fonctions, props, réponses API
- Utiliser `unknown` plutôt que `any` + validation/parsing
- Types partagés dans `core/types/` ou `domain/entities/`
- Générer les types Supabase avec `supabase gen types typescript`

### Nommage
| Élément | Convention | Exemple |
|---|---|---|
| Fichiers composants | `PascalCase.tsx` | `BalanceCard.tsx` |
| Fichiers utilitaires | `kebab-case.ts` | `format-currency.ts` |
| Composants React | `PascalCase` | `BalanceCard` |
| Hooks | `useXxx` | `useBalances` |
| Types/Interfaces | `PascalCase` (pas de prefix `I`) | `User`, `BankAccount` |
| Constantes globales | `UPPER_SNAKE_CASE` | `API_BASE_URL` |
| Fonctions | `camelCase`, verbes | `fetchBalances`, `formatAmount` |
| Stores Zustand | `useXxxStore` | `useAuthStore` |

### Imports (ordre strict)
1. React / React Native
2. Expo SDK
3. Librairies tierces
4. Navigation (expo-router)
5. Stores
6. Hooks
7. Composants
8. Domain / Data
9. Core / Utils
10. Types
11. Assets / Constantes

---

## 11) Standards React Native / UI

### Composants
- Petits, responsabilité unique, props typées
- Pas de "God component" → extraire en sous-composants + hooks
- Mémoization seulement si justifiée et mesurable
- `React.memo` pour les items de liste, `useMemo`/`useCallback` quand pertinent

### Hooks
- Extraire la logique dans des hooks dédiés : `useBalanceSummary()`, `useCardMapping()`
- `useEffect` : dépendances correctes, cleanup systématique
- Pas de logique métier complexe dans `useEffect`

### Design System
- Tokens dans `theme/` : colors, spacing, typography, radius, shadows
- Composants UI réutilisables : `Button`, `Card`, `Input`, `Typography`, `Badge`, `BottomSheet`
- Accessibilité : labels, tailles min 44pt, contrastes WCAG AA, VoiceOver
- Support mode sombre si pertinent

### Listes
- `FlatList` optimisée : `keyExtractor`, `getItemLayout` si taille fixe
- `windowSize`, `maxToRenderPerBatch` configurés
- Séparateurs, états vides, pull-to-refresh

---

## 12) Performance & robustesse

- **Notification < 1 seconde** : utiliser le dernier solde connu en cache local
- Cache local via `expo-secure-store` + Zustand persist pour les données non sensibles
- Éviter les re-renders : structure props plate, keys stables
- Réseau : timeouts (10s), retry (max 2, backoff exponentiel), gestion erreurs
- Offline : afficher dernières données connues + indicateur de fraîcheur
- Logs structurés (désactivés en prod) dans `core/logger/`

---

## 13) Gestion des erreurs (obligatoire)

### Stratégie
```typescript
// core/errors/app-error.ts
export class AppError extends Error {
  constructor(
    message: string,
    public readonly code: ErrorCode,
    public readonly statusCode?: number,
    public readonly context?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export enum ErrorCode {
  NETWORK = 'NETWORK',
  UNAUTHORIZED = 'UNAUTHORIZED',
  BANK_CONNECTION_EXPIRED = 'BANK_CONNECTION_EXPIRED',
  CARD_NOT_MAPPED = 'CARD_NOT_MAPPED',
  VALIDATION = 'VALIDATION',
  UNKNOWN = 'UNKNOWN',
}
```

### Règles
- Erreurs typées : `AppError`, `NetworkError`, `ValidationError`
- Mapping erreurs → UI : message clair + action (réessayer, reconnecter, configurer)
- Centraliser dans `core/errors/`
- Try/catch sur tous les appels réseau et opérations critiques
- Error boundaries React pour les crashes UI

---

## 14) Sécurité (obligatoire)

- **Tokens** : stockés exclusivement en Keychain via `expo-secure-store`
- **Tokens bancaires** : chiffrés AES-256-GCM côté backend avant stockage en DB
- **Session tokens** : UUID v4, rotation possible, invalidation au logout
- **Pas de données sensibles** dans les logs, AsyncStorage ou state non protégé
- **HTTPS** uniquement pour toutes les communications
- **Rate limiting** sur l'API backend
- **Validation** des entrées côté client ET serveur
- **CORS** restrictif côté backend
- **Headers de sécurité** : HSTS, X-Content-Type-Options, etc.

---

## 15) Documentation (obligatoire)

### Dossier
`#documentation/` à la racine du projet.

### Règle
À **chaque nouvelle feature**, créer/mettre à jour :
- `#documentation/README.md` — Sommaire et vue d'ensemble
- `#documentation/architecture.md` — Architecture globale (front + back + natif)
- `#documentation/features/<feature-name>.md` — Doc de chaque feature
- `#documentation/api.md` — Endpoints API, contrats, exemples
- `#documentation/database.md` — Schéma BDD, migrations, relations
- `#documentation/app-intents.md` — Documentation des App Intents Swift
- `#documentation/automation-guide.md` — Guide utilisateur pour les automatisations iOS
- `#documentation/security.md` — Stratégie de sécurité
- `#documentation/ui-components.md` — Design system et composants UI

### Format d'une doc de feature
```markdown
# Nom de la feature

## Objectif
## User flow
## Écrans concernés
## États (loading / empty / error / success)
## Données (sources, cache, mapping)
## Edge-cases
## Sécurité
## Performance
```

---

## 16) JSDoc en français (standard)

Ajouter du JSDoc pour :
- Fonctions utilitaires
- Hooks partagés
- Services (API, storage)
- Use cases / logique métier
- Composants exposés publiquement

```typescript
/**
 * Récupère le résumé des soldes pour la notification pré-paiement.
 * Retourne les 3 comptes configurés (1 principal + 2 secondaires max).
 *
 * @returns Les soldes formatés avec le timestamp de dernière mise à jour.
 * @throws {AppError} Si le token de session est invalide ou expiré.
 */
```

---

## 17) Tests

- **Domain** : tests unitaires sur use-cases et règles métier
- **Data** : tests sur mappers, validation des réponses API
- **UI** : tests composants critiques (smoke + interactions)
- **Intégration** : tests des flux principaux (onboarding, fetch soldes)
- **Priorité** : tester ce qui casse facilement (logique, mapping, edge-cases sécurité)

---

## 18) Style de code (uniformité)

- Imports triés selon l'ordre défini (§10)
- Pas de magie : constantes nommées
- Fonctions courtes et lisibles (≤ 30 lignes idéalement)
- Early return, éviter les if imbriqués
- Commentaires rares mais utiles, JSDoc privilégié
- Destructuring des props
- Template literals plutôt que concaténation
- Optional chaining (`?.`) et nullish coalescing (`??`)
- Pas de `console.log` → utiliser le logger du projet

---

## 19) Écrans de l'application (V1)

| # | Écran | Route | Description |
|---|---|---|---|
| 1 | Splash | `(auth)/index` | Logo + animation d'entrée |
| 2 | Introduction | `(auth)/onboarding/intro` | Présentation de l'app (3 slides) |
| 3 | Connexion | `(auth)/login` | Inscription/connexion email |
| 4 | Connexion banque | `(main)/bank-connection` | Lien Open Banking |
| 5 | Choix compte principal | `(main)/account-selection` | Sélection du compte principal |
| 6 | Choix secondaires | `(main)/account-selection` | Sélection comptes secondaires |
| 7 | Mapping cartes | `(main)/card-mapping` | Association cartes Wallet ↔ comptes |
| 8 | Autorisation notifs | `(main)/notification-permission` | Demande permission notifications |
| 9 | Guide automatisations | `(main)/automation-guide` | Instructions pas-à-pas avec captures |
| 10 | Dashboard | `(main)/index` | Vue principale avec soldes |
| 11 | Réglages | `(main)/settings` | Configuration complète |

---

## 20) Workflow de réponse attendu (à chaque requête)

1. **Reformuler** brièvement l'objectif
2. **Proposer** une approche technique + architecture si nécessaire
3. **Lister** les fichiers à créer/modifier
4. **Écrire** le code TypeScript/Swift/Go en respectant les conventions
5. **Mettre à jour** la documentation dans `#documentation/`
6. **Signaler** les points d'attention (perf, edge-cases, erreurs, sécurité)
7. Si une info dépend d'une doc/version → exécuter **`Usecontext7`**
8. **Créer/mettre à jour** la TODO list pour tracker l'avancement

---

## 21) Notifications — Spécifications

### Notification pré-paiement
```
Titre : 💳 Soldes (maj {X} min)
Corps :
• {Compte principal} : {montant} €
• {Compte secondaire 1} : {montant} €
• {Compte secondaire 2} : {montant} €
```

### Notification post-paiement
```
Titre : ✅ Paiement détecté
Corps :
Solde {Nom du compte} : {montant} €
(maj il y a {X} min)
```

### Notification carte non configurée
```
Titre : ⚠️ Carte non configurée
Corps :
Associez "{NomCarte}" à un compte dans l'app.
```

---

## 22) Open Banking — Agrégateur

### Provider V1 : GoCardless Bank Account Data (ex-Nordigen)
- **Gratuit** jusqu'à 100 requêtes/jour
- Couverture : 2 400+ banques en Europe
- API RESTful, documentation claire
- Pas de frais pour les données de compte (soldes, transactions)

### Flow
1. L'app initie la connexion via le backend
2. Le backend crée un lien GoCardless
3. L'utilisateur s'authentifie sur le site de sa banque
4. GoCardless retourne les identifiants de connexion
5. Le backend stocke et chiffre les tokens d'accès
6. Les soldes sont rafraîchis 2-3x/jour via cron

---

## 23) Règle finale

Si une décision peut améliorer la qualité globale (architecture, perf, UX, sécurité, robustesse),
l'agent est autorisé à proposer un changement **même si non demandé**, mais :
- Il explique clairement le **"pourquoi"**
- Il reste aligné avec l'objectif : **"meilleure app possible"**
- Il ne sur-ingénierie pas : **KISS** (Keep It Simple, Stupid)
