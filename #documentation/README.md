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
| Frontend | Expo SDK 54, React Native, TypeScript (strict) |
| Navigation | Expo Router (file-based) |
| State | Zustand |
| Backend | Go + Chi |
| Database | Supabase (PostgreSQL) |
| Native | Swift (App Intents, Expo Modules API) |
| Auth | Session tokens (Keychain iOS) |
| Open Banking | GoCardless Bank Account Data |

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
```
