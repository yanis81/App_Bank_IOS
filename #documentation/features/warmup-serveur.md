# Warm-up serveur — Render Cold Start

> **Feature #19**
> **Statut** : ✅ Implémentée (Session 3)

---

## Contexte

Le backend est déployé sur **Render Free Tier**. Ce plan endort le serveur après **15 minutes d'inactivité**. Le premier appel API après la mise en veille déclenche un **cold start** qui prend **30 à 50 secondes**. Sans mécanisme de réveil, les appels API du dashboard échouent (timeout), les retries s'enchaînent trop vite, et l'app tombe sur le cache sans données fraîches.

---

## Architecture de la solution

### Flux de démarrage

```
Utilisateur connecté → (main)/_layout.tsx monte
        │
        └─ startWarmup() → ping GET /health toutes les 5s (max 12 essais = 60s)
                │
                ├─ Réponse OK  → status = 'ready'
                │                      │
                │               Dashboard déclenche les 3 appels API
                │               (fetchBalanceSummary, fetchAccounts, fetchConnections)
                │
                └─ Timeout 60s → status = 'timeout'
                                       │
                                  Dashboard déclenche quand même les appels
                                  (utilise le cache local en fallback)
```

### Indicateur visuel

Pendant le warm-up (`status = 'idle' | 'warming'`), le dashboard affiche un bandeau discret :

```
⠋  Connexion au serveur en cours…
```

Ce bandeau disparaît dès que le serveur répond. L'utilisateur comprend que l'app travaille, sans écran bloquant.

---

## Fichiers

| Fichier | Rôle |
|---|---|
| `src/data/api/warmup.ts` | Fonction `pingUntilAlive()` — boucle de ping sur `GET /health` |
| `src/stores/warmup-store.ts` | Store Zustand — gère le statut `idle / warming / ready / timeout` |
| `src/app/(main)/_layout.tsx` | Déclenche `startWarmup()` au montage du layout authentifié |
| `src/app/(main)/index.tsx` | Attend `ready | timeout` avant les appels API, affiche le bandeau |

---

## Paramètres de configuration

Définis dans `src/data/api/warmup.ts` :

| Constante | Valeur | Description |
|---|---|---|
| `PING_TIMEOUT_MS` | `8 000` ms | Timeout par requête ping |
| `PING_INTERVAL_MS` | `5 000` ms | Délai entre deux pings |
| `MAX_ATTEMPTS` | `12` | Nombre max de tentatives (= 60s max) |

---

## Endpoint utilisé

`GET /health` — déjà présent dans le backend Go (route publique, pas d'authentification requise).

```go
// backend/internal/api/router.go
r.Get("/health", h.HealthCheck)
```

---

## États du store

```
idle     → warmup pas encore déclenché
warming  → ping en cours (affiche le bandeau)
ready    → serveur a répondu, appels API déclenchés
timeout  → 60s sans réponse, appels API déclenchés quand même (fallback cache)
```

---

## Points d'attention

- **Idempotent** : `startWarmup()` ne fait rien si le status n'est pas `idle`. Un re-render ou un double-mount du layout n'entraîne pas de pings en double.
- **Pas de blocage** : en cas de timeout, l'app continue et utilise le cache local.
- **Render Free Tier seulement** : en production payante, le cold start disparaît et le premier ping répond immédiatement (< 100ms). Le bandeau ne sera jamais visible.
