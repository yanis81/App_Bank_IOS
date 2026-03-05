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
│   ├── api/             → Router, handlers, middleware
│   ├── domain/          → Modèles, services
│   ├── repository/      → Accès DB (Supabase/Postgres)
│   ├── banking/         → Client GoCardless
│   └── crypto/          → Chiffrement tokens
├── migrations/          → SQL
└── config/              → Env
```

---

## Module natif Swift

Les App Intents sont bridgés via **Expo Modules API** :

- `ShowPreBalanceNotificationIntent` : récupère les 3 soldes configurés et affiche une notification locale.
- `ShowPostBalanceForCardIntent(cardLabel)` : récupère le solde du compte mappé à la carte Wallet et affiche une notification.

Le bridge Swift ↔ React Native (`WalletBridgeModule`) permet de :
- Lire le session token depuis le **Keychain partagé** (App Group `group.com.walletbalance.assistant`).
- Appeler l'API backend directement depuis le contexte natif.
- Déclencher les notifications locales.
- **Lire le cache de soldes** depuis le Keychain partagé (fallback offline).

---

## Flux de données

```
[App Intent Swift] → [Cache Keychain] → Notification (< 1s)
         │                                  │
         └────→ [API Backend Go] → [Supabase DB]
                      │
                Token validé + soldes retournés
                      │
              [Mise à jour cache Keychain]
```

**Stratégie notification < 1s** : les App Intents lisent d'abord le cache Keychain pour afficher une notification immédiate, puis tentent un refresh API en arrière-plan.

---

## Infra V1

| Service | Provider | Tier |
|---|---|---|
| API | Render ou Fly.io | Free |
| Database | Supabase | Free (500 MB) |
| Cron | GitHub Actions | Free |
| Open Banking | GoCardless | Free (100 req/jour) |
