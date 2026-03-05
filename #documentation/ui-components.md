# Composants UI — Wallet Balance Assistant

## Design System

### Tokens
Définis dans `src/theme/` :
- **Colors** (`colors.ts`) : palette dark theme, accent bleu `#4F78FF`
- **Spacing** (`spacing.ts`) : échelle 4px (4, 8, 12, 16, 20, 24, 32, 40, 48, 64)
- **Typography** (`typography.ts`) : h1 → small + styles montants (tabular-nums)
- **Shared** (`shared.ts`) : radius (sm/md/lg/xl/full), shadows (sm/md/lg)

---

## Composants `src/components/ui/`

### Button
Bouton principal de l'app.

**Props :**
| Prop | Type | Défaut |
|---|---|---|
| title | string | — |
| onPress | () => void | — |
| variant | 'primary' \| 'secondary' \| 'outline' \| 'ghost' \| 'danger' | 'primary' |
| size | 'sm' \| 'md' \| 'lg' | 'md' |
| isLoading | boolean | false |
| disabled | boolean | false |
| icon | ReactNode | undefined |
| fullWidth | boolean | false |

**Variantes visuelles :**
- `primary` : fond accent, texte blanc
- `secondary` : fond surface, texte primaire
- `outline` : bordure accent, fond transparent
- `ghost` : pas de fond, texte accent
- `danger` : fond rouge, texte blanc

### Card
Conteneur avec fond surface et radius.

**Props :**
| Prop | Type | Défaut |
|---|---|---|
| children | ReactNode | — |
| variant | 'default' \| 'elevated' \| 'outlined' | 'default' |
| padding | keyof Spacing | 'md' |
| onPress | (() => void) \| undefined | undefined |

### Typography
Composant texte avec styles prédéfinis.

**Props :**
| Prop | Type | Défaut |
|---|---|---|
| children | ReactNode | — |
| variant | 'h1' \| 'h2' \| 'h3' \| 'body' \| 'bodySmall' \| 'caption' \| 'small' \| 'amount' \| 'amountLarge' | 'body' |
| color | keyof Colors | 'textPrimary' |
| align | 'left' \| 'center' \| 'right' | 'left' |

### Input
Champ de saisie stylisé.

**Props :**
| Prop | Type | Défaut |
|---|---|---|
| label | string | — |
| value | string | — |
| onChangeText | (text: string) => void | — |
| placeholder | string | undefined |
| secureTextEntry | boolean | false |
| error | string \| undefined | undefined |
| keyboardType | KeyboardTypeOptions | 'default' |
| autoCapitalize | 'none' \| 'sentences' \| 'words' \| 'characters' | 'none' |

### Badge
Indicateur compact (status, compteur).

**Props :**
| Prop | Type | Défaut |
|---|---|---|
| label | string | — |
| variant | 'info' \| 'success' \| 'warning' \| 'error' | 'info' |
| size | 'sm' \| 'md' | 'md' |

### BottomSheet
Panneau glissant depuis le bas (actions, choix).

**Props :**
| Prop | Type | Défaut |
|---|---|---|
| visible | boolean | — |
| onClose | () => void | — |
| title | string | undefined |
| children | ReactNode | — |
| snapPoints | number[] | [0.5] |

---

## Composants métier `src/components/shared/`

### BalanceCard
Affiche le solde d'un compte avec formatage monétaire.

### AccountListItem
Item de liste pour un compte bancaire (label, IBAN masqué, solde).

### CardMappingRow
Ligne de mapping carte Wallet ↔ compte avec actions.

### EmptyState
État vide avec icône, titre, description et CTA.

### LoadingScreen
Écran de chargement plein écran avec spinner.

### ErrorDisplay
Affichage d'erreur avec message, code et bouton réessayer.

---

## Accessibilité

- Tailles minimum tactiles : **44×44 pt**
- Labels d'accessibilité sur tous les éléments interactifs
- Contrastes **WCAG AA** (ratio ≥ 4.5:1 pour le texte)
- Support **VoiceOver** : rôles, labels, hints
- Regroupement logique des éléments (accessibilityGrouped)
- Montants lus correctement : "mille deux cent trente-quatre euros et cinquante-six centimes"

---

## Animations

Utilisation de **React Native Reanimated** pour :
- Transitions de page (fade in/slide)
- Apparition des cartes de solde (fade + translateY)
- Boutons (pression spring)
- Indicateur de rafraîchissement
