# Guide de lancement — Wallet Balance Assistant

## Prérequis

- **Node.js** 18+ installé (vérifie avec `node --version`)
- **npm** (inclus avec Node.js)
- **Expo Go** installé sur ton iPhone depuis l'App Store
- Les deux appareils (PC et iPhone) sur le **même réseau Wi-Fi**

---

## Lancement rapide

### 1. Ouvrir un terminal dans le projet

```powershell
cd C:\Users\yanis\Desktop\Bank
```

### 2. Lancer le serveur de développement

```powershell
npx expo start
```

Tu verras un **QR Code** dans le terminal.

### 3. Scanner le QR Code

- Ouvre l'**appareil photo** de ton iPhone
- Scanne le QR Code affiché dans le terminal
- Tape la notification qui apparaît → ça ouvre **Expo Go**
- L'app se compile et se lance

### Résultat attendu

Au premier lancement, tu verras :
1. **Écran Splash** (logo sur fond sombre `#0A0E1A`, 2 secondes)
2. **Écran d'introduction** (3 slides de présentation, bouton "Commencer")
3. **Écran de connexion** (email + mot de passe)

> **Note :** Le backend n'est pas encore déployé. L'inscription/connexion échouera avec une erreur réseau.
> C'est normal — tu peux quand même voir le design et la navigation.

---

## Mode aperçu sans backend

Pour naviguer dans l'app sans backend, tu peux temporairement modifier le store d'auth pour un accès direct au dashboard. Voici comment :

### Option A — Bypass rapide (juste pour voir)

Dans `src/stores/auth-store.ts`, modifie temporairement `initialize` :

```typescript
initialize: async () => {
  // TEMPORAIRE — bypass auth pour preview
  set({
    user: { id: 'preview', email: 'preview@test.com', createdAt: new Date().toISOString() },
    isInitialized: true,
    isLoading: false,
  });
},
```

Puis relance `npx expo start`. Tu arriveras directement sur le **dashboard** avec :
- Le skeleton de chargement (shimmer)
- Les CTA d'onboarding (connecter banque, choisir comptes, etc.)
- Le bouton settings (⚙️)
- Le bandeau offline si tu coupes le Wi-Fi

> **Important :** N'oublie pas de remettre le code original après la preview !

### Option B — avec la navigation complète

Garde le code tel quel et parcours les écrans auth :
- Splash → Intro (3 slides) → Login (le formulaire s'affiche mais le submit échouera)

---

## Commandes utiles

| Commande | Description |
|---|---|
| `npx expo start` | Lance le serveur Metro (développement) |
| `npx expo start --clear` | Lance avec cache nettoyé |
| `npx expo start --tunnel` | Lance en mode tunnel (utile si Wi-Fi bloque) |
| `npx tsc --noEmit` | Vérifie la compilation TypeScript |
| `npx expo prebuild` | Génère le projet natif iOS (pour build local) |

---

## Structure des écrans que tu verras

```
📱 Splash (2s)
 └─➤ 📱 Introduction (3 slides)
      └─➤ 📱 Login / Register
           └─➤ 📱 Dashboard ← écran principal
                ├─ 📊 Skeleton loading (shimmer)
                ├─ 📡 Bandeau offline (hors connexion)
                ├─ 🚀 Barre progression onboarding (X/4)
                ├─ 💳 Carte soldes (avec FreshnessIndicator)
                ├─ 📋 CTA étapes de configuration
                └─ ⚙️ Settings
                     ├─ 🏦 Connexion bancaire
                     ├─ 💳 Mapping cartes
                     ├─ 📋 Comptes de notification
                     ├─ 🔒 Face ID toggle
                     ├─ 🕶️ Mode confidentialité
                     ├─ 🔄 Fréquence refresh
                     └─ ⚡ Guide automatisations
```

---

## Problèmes courants

### "Network request failed"
→ Normal, le backend n'est pas encore lancé. L'app gère ça gracieusement avec le cache fallback.

### QR Code ne fonctionne pas
→ Essaie `npx expo start --tunnel` pour passer par un tunnel ngrok.

### L'app ne se rafraîchit pas
→ Secoue ton iPhone pour ouvrir le menu développeur → "Reload".

### Erreur de compilation TypeScript
→ Lance `npx tsc --noEmit` pour voir les erreurs exactes.

---

## Prochaines étapes

1. **Backend Go** : Implémenter les endpoints API (voir `#documentation/api.md`)
2. **Supabase** : Configurer la base de données (voir `#documentation/database.md`)
3. **GoCardless** : Obtenir les clés API pour l'Open Banking
4. **Tests** : Ajouter les tests unitaires sur le domaine
5. **EAS Build** : Configurer la build iOS native pour les App Intents
