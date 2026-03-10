# Sécurité — Wallet Balance Assistant

## Principes

1. **Défense en profondeur** : couches multiples de protection (client, réseau, serveur, base de données).
2. **Moindre privilège** : chaque composant n'a accès qu'au strict nécessaire.
3. **Zéro confiance** : valider toutes les entrées côté client ET serveur.

---

## Stockage des secrets

### Côté client (iOS)
| Donnée | Mécanisme |
|---|---|
| Token Clerk JWT | Géré par **@clerk/expo** (stockage interne sécurisé) |
| Token partagé (App Intents) | **iOS Keychain** via App Group `group.com.walletbalance.assistant` |
| Cache soldes (fallback offline) | **App Group UserDefaults** (accès rapide < 1s) |
| Données de session | Zustand (mémoire, non persisté) |

- Aucun secret dans AsyncStorage, logs ou state non protégé.
- **App Group** `group.com.walletbalance.assistant` : permet aux App Intents Swift d'accéder au même Keychain et UserDefaults que l'app React Native.
- Le cache de soldes dans l'App Group permet l'affichage offline < 1 seconde via les App Intents.
- Si l'app est supprimée, les App Intents disparaissent automatiquement.

### Côté serveur
| Donnée | Mécanisme |
|---|---|
| Tokens bancaires (access/refresh GoCardless) | **AES-256-GCM** chiffrement avant stockage en DB |
| Auth utilisateurs | **Clerk** (JWT signés, vérifiés par le middleware Go via clerk-sdk-go) |
| Clé de chiffrement AES | Variable d'environnement serveur (`ENCRYPTION_KEY`, 64 hex = 32 bytes) |
| Clé cron | Variable d'environnement (`CRON_KEY`) |
| Clés GoCardless | Variables d'environnement (`GOCARDLESS_SECRET_ID`, `GOCARDLESS_SECRET_KEY`) |

> **Note :** Clerk gère entièrement l'authentification. Le backend vérifie les JWT Clerk et upsert les utilisateurs en DB avec leur `clerk_user_id`.

---

## Authentification

- **Clerk** (@clerk/expo v3 côté frontend, clerk-sdk-go v2 côté backend).
- JWT signés par Clerk, transmis dans `Authorization: Bearer <clerk_jwt>`.
- Le middleware Go `ClerkAuth` vérifie la signature, extrait le `Subject` (clerk_user_id), et upsert l'utilisateur en DB.
- Déconnexion gérée par `signOut()` de Clerk.
- Pour les App Intents : le token Clerk est dupliqué dans le Keychain partagé (App Group) pour accès natif.

---

## Communication réseau

- **HTTPS uniquement** pour toutes les communications API.
- **Timeout** : 10 secondes par requête.
- **Retry** : max 2 tentatives avec backoff exponentiel.
- **CORS** restrictif : seul le domaine de l'app autorisé.

---

## Protection API

### Rate limiting
- Limite par IP et par token utilisateur.
- Endpoints sensibles (login, register) : limites plus strictes.

### Headers de sécurité
- `Strict-Transport-Security` (HSTS)
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Content-Security-Policy`

### Validation
- Toutes les entrées validées côté serveur (email, longueur, format).
- Requêtes SQL paramétrées (jamais de concaténation).

---

## App Intents — Sécurité

- Les App Intents Swift lisent le token Clerk depuis le **Keychain partagé** (App Group).
- Chaque appel Intent → requête API avec le token → validation serveur via Clerk.
- **Cache fallback** : si le réseau est indisponible, les App Intents lisent les derniers soldes cachés dans l'App Group UserDefaults.
- **Si l'app est supprimée** : les App Intents disparaissent → les automatisations ne fonctionnent plus.
- **Si un raccourci est partagé** : il ne contient pas le token → inutilisable par un tiers.
- Pas de données bancaires stockées dans les Intents eux-mêmes.

---

## Chiffrement des tokens bancaires

```
Algorithme : AES-256-GCM
Clé : 32 octets (ENCRYPTION_KEY, env var, 64 caractères hex)
Nonce : 12 octets, unique par chiffrement (généré via crypto/rand)
Tag : 16 octets d'authentification (intégré par GCM)
Format stocké : hex(nonce || ciphertext || tag)
```

Implémentation Go dans `backend/internal/crypto/crypto.go`.
Fonctions : `Encrypt(plaintext) → hexCiphertext` et `Decrypt(hexCiphertext) → plaintext`.

---

## Données sensibles — Ce qui ne doit JAMAIS être :

| Interdit | Raison |
|---|---|
| Logs (console.log, logger en prod) | Exposition de données |
| AsyncStorage | Non chiffré sur iOS |
| State Redux/Zustand persisté | Accessible en clair |
| Réponses API en cache non sécurisé | Exposition de soldes |
| Code source (hardcodé) | Secrets extractibles |

---

## Plan d'évolution (V2)

- Token rotation automatique via Clerk.
- Biométrie (Face ID) pour accès à l'app.
- Certificate pinning.
- Audit de sécurité externe.

---

## Mode confidentialité (Privacy Mode)

- Quand `privacy_mode = true`, les notifications affichent **« Solde disponible ✓ »** sans montant.
- Sur le dashboard, les montants sont masqués (`••••••`).
- L'utilisateur doit ouvrir l'app et désactiver le mode pour voir les vrais montants.
- Protège contre le shoulder surfing et les notifications visibles sur l'écran de verrouillage.

---

## Audit Log

- Table `audit_log` pour traçabilité des événements critiques.
- Actions tracées : `login`, `logout`, `register`, `bank_connect`, `bank_disconnect`, `bank_renew_consent`, `settings_update`, `card_mapping_update`, `account_selection_update`, `privacy_mode_toggle`.
- Chaque entrée contient `user_id`, `action`, `metadata` (JSONB) et `created_at`.
- Utile pour le support, la conformité réglementaire et le debug.
