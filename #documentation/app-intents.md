# App Intents (Swift) — Wallet Balance Assistant

## Vue d'ensemble

Les **App Intents** permettent à iOS Shortcuts (Raccourcis) d'exécuter des actions définies par l'app.  
Deux intents sont nécessaires pour les notifications automatiques de soldes.

---

## Intents

### ShowPreBalanceNotificationIntent

**Déclencheur :** Automatisation Raccourcis → App "Wallet" ouverte (double-clic bouton latéral).

**Comportement :**
1. Lit le `session_token` depuis le Keychain (groupe d'app partagé).
2. Appelle `GET /api/v1/balances/summary` avec le token.
3. Si succès → envoie une notification locale avec les soldes.
4. Si échec → envoie une notification d'erreur.

**Notification envoyée :**
```
Titre : 💳 Soldes (maj 12 min)
Corps :
• Compte courant : 1 234,56 €
• Livret A : 5 678,90 €
```

**Fallback :** Si pas de réseau, utilise les dernières données en cache local.

---

### ShowPostBalanceForCardIntent

**Paramètre :** `cardLabel` (String) — nom de la carte Wallet utilisée pour le paiement.

**Déclencheur :** Automatisation Raccourcis → Transaction Apple Pay détectée.

**Comportement :**
1. Lit le `session_token` depuis le Keychain.
2. Appelle `GET /api/v1/balances/by-wallet-card?cardLabel={cardLabel}` avec le token.
3. Si succès → notification avec le solde du compte associé.
4. Si carte non mappée → notification d'avertissement.

**Notification (succès) :**
```
Titre : ✅ Paiement détecté
Corps :
Solde Compte courant : 1 234,56 €
(maj il y a 12 min)
```

**Notification (carte non configurée) :**
```
Titre : ⚠️ Carte non configurée
Corps :
Associez "Boursobank Visa" à un compte dans l'app.
```

---

## Architecture Swift

```
src/native/ios/
├── AppIntents/
│   ├── ShowPreBalanceNotificationIntent.swift
│   └── ShowPostBalanceForCardIntent.swift
└── ExpoModule/
    └── WalletBridgeModule.swift
```

### Fichier Swift — Structure type

```swift
import AppIntents
import Foundation

struct ShowPreBalanceNotificationIntent: AppIntent {
    static var title: LocalizedStringResource = "Afficher les soldes"
    static var description = IntentDescription("Affiche les soldes bancaires en notification")

    func perform() async throws -> some IntentResult {
        // 1. Lire token Keychain
        // 2. Appeler API
        // 3. Envoyer notification locale
        return .result()
    }
}
```

### WalletBridgeModule

Module Expo natif (Swift → React Native) utilisant l'**Expo Modules API**.  
Permet au code TypeScript de :
- Vérifier si les App Intents sont enregistrés.
- Forcer un rafraîchissement des données du Keychain.
- Partager des données entre l'app RN et le module natif.

---

## Keychain — Groupe d'app partagé

Les App Intents s'exécutent dans un processus séparé de l'app principale.  
Pour accéder au `session_token`, un **App Group** Keychain est nécessaire :

- **Identifiant :** `group.com.walletbalance.assistant`
- Configuré dans le provisioning profile Apple Developer.
- `expo-secure-store` utilise ce groupe pour le stockage.

---

## Automatisations iOS (Raccourcis)

L'app **ne peut pas créer** les automatisations programmatiquement (limitation Apple).  
L'utilisateur doit les créer manuellement via l'app Raccourcis.

### Automatisation pré-paiement
1. Ouvrir **Raccourcis** → **Automatisations** → **+**
2. Trigger : **App** → sélectionner **Wallet** → **Est ouverte**
3. Action : chercher **"Afficher les soldes"** (ShowPreBalanceNotificationIntent)
4. Désactiver **"Demander avant d'exécuter"**

### Automatisation post-paiement
1. Ouvrir **Raccourcis** → **Automatisations** → **+**
2. Trigger : **Transaction** (Apple Pay)
3. Action : chercher **"Solde après paiement"** (ShowPostBalanceForCardIntent)
4. Le paramètre `cardLabel` est rempli automatiquement par le trigger
5. Désactiver **"Demander avant d'exécuter"**

---

## Contraintes iOS

| Contrainte | Impact |
|---|---|
| Pas de création automatique d'automatisations | L'app doit guider l'utilisateur |
| App Intents supprimés si app supprimée | Sécurité naturelle |
| Exécution dans un processus séparé | Nécessite App Group pour le Keychain |
| iOS 16+ requis | App Intents Framework |
