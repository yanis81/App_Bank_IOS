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
| `session_token` | **iOS Keychain** via `expo-secure-store` (App Group partagé) |
| Cache soldes (fallback offline) | **Keychain partagé** (App Group `group.com.walletbalance.assistant`) |
| Données de session | Zustand (mémoire, non persisté) |

- Aucun secret dans AsyncStorage, logs ou state non protégé.
- **App Group** `group.com.walletbalance.assistant` : permet aux App Intents Swift d'accéder au même Keychain que l'app React Native.
- Le cache de soldes dans le Keychain partagé permet l'affichage offline < 1 seconde via les App Intents.
- Si l'app est supprimée, le token Keychain peut être nettoyé au prochain login.

### Côté serveur
| Donnée | Mécanisme |
|---|---|
| Tokens bancaires (access/refresh) | **AES-256-GCM** chiffrement avant stockage en DB |
| Session tokens | UUID v4, **hashés SHA-256** avant stockage en DB |
| Clé de chiffrement AES | Variable d'environnement serveur (`ENCRYPTION_KEY`) |
| Clé cron | Variable d'environnement (`CRON_SECRET_KEY`) |

> **Note :** Le token en clair n'est jamais persisté en DB. Le client envoie le token brut, le serveur le hash SHA-256 pour comparaison.

---

## Authentification

- **Session token** : UUID v4 généré à l'inscription/connexion.
- Transmis dans `Authorization: Bearer <token>`.
- Invalidé au logout (supprimé de la DB).
- Pas de JWT pour simplifier la V1 (pas de gestion d'expiration côté client).
- Rotation possible en V2.

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

- Les App Intents Swift lisent le `session_token` depuis le **Keychain partagé** (App Group).
- Chaque appel Intent → requête API avec le token → validation serveur.
- **Cache fallback** : si le réseau est indisponible, les App Intents lisent les derniers soldes cachés dans le Keychain partagé.
- **Si l'app est supprimée** : les App Intents disparaissent → les automatisations ne fonctionnent plus.
- **Si un raccourci est partagé** : il ne contient pas le token → inutilisable par un tiers.
- Pas de données bancaires stockées dans les Intents eux-mêmes.

---

## Chiffrement des tokens bancaires

```
Algorithme : AES-256-GCM
Clé : 32 octets (ENCRYPTION_KEY, env var)
Nonce : 12 octets, unique par chiffrement
Tag : 16 octets d'authentification
Format stocké : base64(nonce || ciphertext || tag)
```

Implémentation Go dans `internal/crypto/`.

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

- ~~Hashing des session tokens côté DB (bcrypt/argon2)~~ → **Implémenté en V1** (SHA-256).
- Token rotation automatique.
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
