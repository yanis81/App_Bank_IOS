# Guide des automatisations iOS — Wallet Balance Assistant

## Objectif

L'utilisateur doit créer **2 automatisations** dans l'app **Raccourcis** (Shortcuts) d'Apple pour recevoir les notifications de soldes automatiquement.

Apple ne permet pas aux apps de créer des automatisations programmatiquement. L'app guide donc l'utilisateur étape par étape.

---

## Automatisation 1 — Soldes pré-paiement

**But :** Afficher les soldes quand l'utilisateur ouvre Apple Wallet (double-clic bouton latéral).

### Étapes pour l'utilisateur

1. Ouvrir l'app **Raccourcis** sur iPhone
2. Aller dans l'onglet **Automatisation**
3. Appuyer sur **+** (Nouvelle automatisation)
4. Choisir **App**
5. Sélectionner **Wallet** dans la liste des apps
6. Cocher **Est ouverte**
7. Sélectionner **Exécuter immédiatement**
8. Appuyer sur **Suivant**
9. Chercher l'action **"Afficher les soldes"**
10. Appuyer sur **OK**

### Résultat
Chaque ouverture de Wallet déclenche une notification avec les soldes des comptes configurés.

---

## Automatisation 2 — Solde post-paiement

**But :** Afficher le solde du compte après un paiement Apple Pay.

### Étapes pour l'utilisateur

1. Ouvrir l'app **Raccourcis** sur iPhone
2. Aller dans l'onglet **Automatisation**
3. Appuyer sur **+** (Nouvelle automatisation)
4. Choisir **Transaction**
5. Sélectionner **Apple Pay** (avec n'importe quelle carte)
6. Sélectionner **Exécuter immédiatement**
7. Appuyer sur **Suivant**
8. Chercher l'action **"Solde après paiement"**
9. Le nom de la carte sera transmis automatiquement
10. Appuyer sur **OK**

### Résultat
Chaque paiement Apple Pay → notification avec le solde du compte mappé à la carte utilisée.

---

## Écran de guidage dans l'app

L'écran `(main)/automation-guide` présente ces instructions avec :
- Des **icônes numérotées** pour chaque étape
- Un bouton **"Ouvrir Raccourcis"** (deep link vers l'app Shortcuts)
- Un **toggle** pour marquer chaque automatisation comme configurée
- Des **captures d'écran annotées** (à ajouter en V2)

---

## Dépannage

| Problème | Solution |
|---|---|
| L'action n'apparaît pas dans Raccourcis | Ouvrir l'app au moins une fois pour enregistrer les Intents |
| La notification ne s'affiche pas | Vérifier les permissions de notification dans Réglages |
| "Demander avant d'exécuter" activé | Désactiver cette option dans l'automatisation |
| Solde ancien affiché | Le cache est utilisé si pas de réseau ; attendre le prochain rafraîchissement |
| Carte non reconnue | Vérifier le mapping dans l'app (écran Cartes Wallet) |
