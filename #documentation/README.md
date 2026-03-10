# Wallet Balance Assistant — Documentation

> Application iOS pour afficher les soldes bancaires avant et après un paiement Apple Pay.

---

## Sommaire

| Document | Description |
|---|---|
| [Architecture](architecture.md) | Architecture globale (frontend, backend, natif) |
| [API](api.md) | Endpoints backend, contrats, exemples |
| [Base de données](database.md) | Schéma BDD, relations, migrations |
| [Sécurité](security.md) | Stratégie de sécurité complète |
| [App Intents](app-intents.md) | Documentation des App Intents Swift |
| [Guide automatisations](automation-guide.md) | Guide utilisateur pour les raccourcis iOS |
| [Composants UI](ui-components.md) | Design system et tokens |
| [Features](features/) | Documentation par fonctionnalité |

---

## Stack technique

| Couche | Technologie |
|---|---|
| Frontend | Expo SDK 55, React Native 0.83, TypeScript (strict) |
| Navigation | Expo Router (file-based) |
| State | Zustand |
| Backend | Go 1.26 + Chi v5 |
| Database | Neon (PostgreSQL serverless) |
| Native | Swift (App Intents, Expo Modules API) |
| Auth | Clerk (@clerk/expo v3) |
| Open Banking | GoCardless Bank Account Data |
| Chiffrement | AES-256-GCM (tokens bancaires) |

---

## Structure du projet

```
src/
├── app/           → Écrans et layouts (Expo Router)
├── components/    → Composants UI réutilisables
├── domain/        → Logique métier pure
├── data/          → API client, repositories, storage
├── stores/        → State management (Zustand)
├── hooks/         → Hooks partagés
├── core/          → Config, erreurs, logger, utils
├── theme/         → Design tokens
├── i18n/          → Traductions
└── assets/        → Images, fonts

modules/
└── wallet-bridge/ → Module natif Swift (App Intents + Keychain partagé)

backend/
├── cmd/server/    → Point d'entrée Go
├── internal/      → API, handlers, repository, banking, crypto
├── migrations/    → SQL
└── config/        → Env vars
```
