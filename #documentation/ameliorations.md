# Améliorations — Wallet Balance Assistant

> Ce fichier sert de **mémoire** de toutes les améliorations implémentées et les idées futures.
> Mis à jour à chaque session de développement.

---

## Améliorations implémentées

### Session 1 — Fondations (8 améliorations)

| # | Amélioration | Fichiers | Statut |
|---|---|---|---|
| 1 | **Hash SHA-256 session tokens** — Les tokens sont hashés via `expo-crypto` avant stockage DB | `core/utils/hash.ts` | ✅ |
| 2 | **App Group Keychain** — Partage du Keychain entre l'app et les App Intents via App Group | `app.json` | ✅ |
| 3 | **Cache fallback offline** — Soldes cachés dans le Keychain partagé pour affichage < 1s | `data/storage/shared-cache.ts`, `stores/bank-store.ts` | ✅ |
| 4 | **Re-consentement Enable Banking (PSD2)** — Bannière d'alerte + renouvellement automatique | `components/shared/ConsentExpiryBanner.tsx`, `domain/entities/`, `data/api/endpoints.ts` | ✅ |
| 5 | **Onboarding progressif** — CTA contextuels + barre de progression au lieu d'un tunnel | `hooks/useOnboardingProgress.ts`, `app/(main)/index.tsx` | ✅ |
| 6 | **Versioning API** — Headers `X-API-Version` et `X-App-Version` sur chaque requête | `data/api/api-client.ts`, `core/config/constants.ts` | ✅ |
| 7 | **Mode confidentialité** — Montants masqués `••••••` sur le dashboard et notifications | `app/(main)/index.tsx`, `app/(main)/settings.tsx` | ✅ |
| 8 | **Audit log** — Type `AuditLogEntry` + table `audit_log` en DB pour traçabilité | `domain/entities/`, `#documentation/database.md` | ✅ |

### Session 3 — Stabilité & cold start (2 améliorations)

| # | Amélioration | Fichiers | Statut |
|---|---|---|---|
| 19 | **Warm-up serveur Render** — Ping `GET /health` au démarrage pour réveiller le free tier avant les appels API | `data/api/warmup.ts`, `stores/warmup-store.ts`, `app/(main)/_layout.tsx`, `app/(main)/index.tsx` | ✅ |
| 20 | **Guard `formatTimeAgo` + `FreshnessIndicator`** — Protection contre `undefined` sur `lastUpdated` quand le cache est vide | `core/utils/format-currency.ts`, `components/shared/FreshnessIndicator.tsx` | ✅ |

---

### Session 2 — Qualité & UX (10 améliorations)

| # | Amélioration | Fichiers | Statut |
|---|---|---|---|
| 9 | **ErrorBoundary React** — Capture les erreurs JS et affiche un écran de récupération | `components/shared/AppErrorBoundary.tsx`, layouts `(auth)` et `(main)` | ✅ |
| 10 | **Hooks d'abstraction métier** — Encapsulation fetch + cache + loading/error | `hooks/useBalanceSummary.ts`, `useCardMappings.ts`, `useBankConnections.ts`, `useSettings.ts` | ✅ |
| 11 | **Repositories implémentés** — Implémentation des ports du domaine | `data/repositories/*.ts` (5 fichiers) | ✅ |
| 12 | **Network status & offline** — Détection réseau + bandeau "Hors connexion" | `stores/network-store.ts`, `components/shared/OfflineBanner.tsx` | ✅ |
| 13 | **Biométrie Face ID** — Protection Face ID/Touch ID au lancement + toggle Settings | `hooks/useBiometricAuth.ts`, `app/_layout.tsx`, `app/(main)/settings.tsx` | ✅ |
| 14 | **Deep linking post-auth** — Callback Enable Banking → redirection auto vers sélection comptes | `app/(main)/bank-callback.tsx` | ✅ |
| 15 | **Indicateur de fraîcheur** — Badge coloré (vert/orange/rouge) selon ancienneté des données | `components/shared/FreshnessIndicator.tsx`, dashboard | ✅ |
| 16 | **Skeleton loading** — Effet shimmer au lieu des spinners pour le chargement initial | `components/ui/Skeleton.tsx`, dashboard | ✅ |
| 17 | **Haptic feedback** — Retour tactile sur toggles, CTA et logout | `core/utils/haptics.ts`, settings | ✅ |
| 18 | **Toast notifications in-app** — Messages éphémères élégants (succès, erreur, info) | `stores/toast-store.ts`, `components/shared/ToastContainer.tsx` | ✅ |

---

## Idées futures (backlog)

### Priorité haute

| # | Idée | Description | Impact |
|---|---|---|---|
| F1 | **Animations de transition** | Utiliser React Native Reanimated pour des transitions entre écrans, reveal de montants, animations de cartes | UX premium |
| F2 | **Pull-to-refresh haptique** | Combiner `RefreshControl` avec haptic feedback au déclenchement + animation de succès | UX |
| F21 | **Rafraîchissement des soldes depuis l'app** | Ajouter un endpoint backend `POST /api/v1/balances/refresh` protégé par la session utilisateur (pas par X-Cron-Key). Le backend appelle Enable Banking en temps réel pour les comptes de l'utilisateur et met à jour la DB. Le pull-to-refresh du dashboard déclenchera ce vrai refresh au lieu de simplement relire la DB. | UX essentielle |
| F3 | **Écran "Détail compte"** | Voir l'historique des soldes d'un compte sur les 30 derniers jours (tableau ou mini-graphe) | Fonctionnel |
| F4 | **Widget iOS** | Widget Today/Lock Screen affichant le solde du compte principal (WidgetKit + SwiftUI) | Fonctionnel clé |
| F5 | **Gestion multi-banques** | Supporter la connexion de plusieurs banques avec regroupement visuel | Fonctionnel |

### Priorité moyenne

| # | Idée | Description | Impact |
|---|---|---|---|
| F6 | **Theme clair** | Support du mode Light avec `useColorScheme` + variantes de couleurs | Accessibilité |
| F7 | **Localisation i18n** | Internationalisation (fr/en) pour élargir le marché | Market |
| F8 | **Animations micro-interactions** | Bounce sur les cartes au tap, animation du badge de progression, shimmer sur les montants | UX polish |
| F9 | **Push notifications** | Notifications distantes via APNs pour alerter l'utilisateur de changements de solde | Fonctionnel |
| F10 | **Graphique de soldes** | Mini-graphe sparkline sous chaque carte de solde (derniers 7 jours) | Data viz |
| F11 | **Export PDF** | Exporter un résumé des soldes au format PDF (partage, preuve) | Utilitaire |
| F12 | **Mock server (MSW)** | Mock Service Worker pour le développement local sans backend | DX |

### Priorité basse

| # | Idée | Description | Impact |
|---|---|---|---|
| F13 | **Certificate pinning** | SSL pinning pour empêcher les attaques MITM | Sécurité |
| F14 | **Crash reporting** | Intégrer Sentry ou Bugsnag pour les reports d'erreur en production | Ops |
| F15 | **Analytics** | Intégrer Mixpanel ou Posthog pour mesurer l'usage (opt-in) | Business |
| F16 | **A/B testing** | Framework de feature flags pour tester des variantes d'UI | Growth |
| F17 | **Tests E2E** | Detox ou Maestro pour les tests end-to-end automatisés | Qualité |
| F18 | **CI/CD pipeline** | GitHub Actions pour build auto, lint, tests, déploiement EAS | DevOps |
| F19 | **Rate limiting client** | Throttle les appels API côté client pour éviter les abus | Perf |
| F20 | **Storybook mobile** | Catalogue visuel des composants UI pour la maintenance du design system | DX |

---

## Checklist mise en production

### Infrastructure (Render)
| # | Tâche | Statut |
|---|---|---|
| P1 | `CRON_KEY` définie sur Render (`fafayaya2026` ou autre) | ✅ |
| P2 | Toutes les variables d'env Render renseignées (`DATABASE_URL`, `CLERK_SECRET_KEY`, `ENCRYPTION_KEY`, `ENABLE_BANKING_APP_ID`, `ENABLE_BANKING_PRIVATE_KEY`, `APP_URL`) | À vérifier |
| P3 | GitHub Actions cron configuré pour appeler `POST /api/v1/jobs/refresh-balances` toutes les X heures avec `X-Cron-Key` | ❌ À faire |

### GitHub Actions — cron refresh balances
Créer `.github/workflows/refresh-balances.yml` :
```yaml
name: Refresh Balances
on:
  schedule:
    - cron: '0 */6 * * *'  # toutes les 6h
jobs:
  refresh:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger balance refresh
        run: |
          curl -X POST ${{ secrets.API_URL }}/api/v1/jobs/refresh-balances \
            -H "X-Cron-Key: ${{ secrets.CRON_KEY }}"
```
Secrets GitHub à ajouter : `API_URL=https://app-bank-ios.onrender.com` et `CRON_KEY=fafayaya2026`.

### App mobile (avant release App Store)
| # | Tâche | Statut |
|---|---|---|
| P4 | Build EAS production (`eas build --platform ios --profile production`) | ❌ |
| P5 | App Group configuré dans les Capabilities Xcode (`group.com.walletbalance.app`) | ❌ |
| P6 | App Intents Swift compilés et testés sur vrai device | ❌ |
| P7 | TestFlight distribué pour tests utilisateurs | ❌ |

---

## Notes techniques

- **expo-crypto** : Utilisé pour SHA-256 (hashing tokens). Compatible iOS/Android.
- **expo-haptics** : Retour haptique natif (iOS uniquement en vibration, Android en vibration).
- **expo-local-authentication** : Face ID / Touch ID / fingerprint, fallback code possible.
- **@react-native-community/netinfo** : Détection réseau temps réel, listener événementiel.
- **SafeAreaProvider** : Fourni automatiquement par Expo Router.
- **TypeScript strict** : Compilation 0 erreur vérifiée à chaque session.

---

*Dernière mise à jour : 14 mars 2026*
