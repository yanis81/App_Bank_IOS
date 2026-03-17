/**
 * Config plugin Expo — Ajoute les App Intents Swift au target principal iOS.
 *
 * POURQUOI ce plugin est nécessaire :
 * Les App Intents dans un pod Expo ne sont PAS scannés par le build phase
 * "Extract App Intents Metadata" d'Xcode → iOS Raccourcis ne les voit pas.
 * Ce plugin copie les fichiers dans le target principal pour corriger ce problème.
 */

const { withXcodeProject, withDangerousMod } = require('@expo/config-plugins');
const path = require('path');
const fs = require('fs');

const SOURCE_DIR = 'app-intents';

/**
 * Étape 1 — Copie physique des Swift files dans le dossier iOS généré.
 * S'exécute en dernier (withDangerousMod = phase de finalisation du prebuild).
 */
function withCopyAppIntents(config) {
  return withDangerousMod(config, [
    'ios',
    async (config) => {
      const { projectRoot, platformProjectRoot, projectName } = config.modRequest;
      const sourceDir = path.join(projectRoot, SOURCE_DIR);

      if (!fs.existsSync(sourceDir)) {
        console.warn('[withAppIntents] Dossier app-intents/ introuvable — ignoré.');
        return config;
      }

      const destDir = path.join(platformProjectRoot, projectName, 'AppIntents');
      if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
      }

      const files = fs.readdirSync(sourceDir).filter((f) => f.endsWith('.swift'));
      for (const file of files) {
        fs.copyFileSync(path.join(sourceDir, file), path.join(destDir, file));
      }
      console.log(`[withAppIntents] ${files.length} fichier(s) copié(s) dans ${projectName}/AppIntents/`);

      return config;
    },
  ]);
}

/**
 * Étape 2 — Enregistrement dans le .pbxproj.
 * Ajoute les fichiers à la PBXSourcesBuildPhase du target principal,
 * ce qui déclenche "Extract App Intents Metadata" à la compilation.
 *
 * IMPORTANT : on DOIT passer un groupKey à addSourceFile pour éviter
 * addPluginFile → correctForPluginsPath qui crash si aucun groupe "Plugins"
 * n'existe dans le projet Xcode (TypeError: Cannot read property 'path' of null).
 */
function withRegisterAppIntents(config) {
  return withXcodeProject(config, (config) => {
    const { modResults: proj, modRequest: { projectRoot, projectName } } = config;

    const sourceDir = path.join(projectRoot, SOURCE_DIR);
    if (!fs.existsSync(sourceDir)) return config;

    const files = fs.readdirSync(sourceDir).filter((f) => f.endsWith('.swift'));
    if (files.length === 0) return config;

    const mainTargetUuid = proj.getFirstTarget().uuid;

    // Obtenir la clé du groupe racine via getFirstProject().firstProject.mainGroup.
    // C'est la seule méthode fiable — findPBXGroupKey({ path/name }) peut retourner
    // null sur les projets Expo SDK 55 dont le groupe source n'a pas de path défini.
    const rootGroupKey = proj.getFirstProject().firstProject.mainGroup;

    // Créer le groupe AppIntents avec CHEMIN COMPLET relatif à ios/.
    // ios/ est l'ancre du groupe racine (sourceTree = "<group>" sans path propre).
    // → ios/ + WalletBalanceAssistant/AppIntents/ = ios/WalletBalanceAssistant/AppIntents/
    const { uuid: appIntentsGroupKey } = proj.addPbxGroup(
      [],
      'AppIntents',
      `${projectName}/AppIntents`
    );

    // Rattacher au groupe racine
    const rootGroup = proj.getPBXGroupByKey(rootGroupKey);
    if (rootGroup && rootGroup.children) {
      rootGroup.children.push({ value: appIntentsGroupKey, comment: 'AppIntents' });
    }

    // Ajouter les fichiers avec uniquement le NOM (relatif au path du groupe).
    // Résolution finale : ios/WalletBalanceAssistant/AppIntents/<fileName> ✓
    for (const fileName of files) {
      proj.addSourceFile(fileName, { target: mainTargetUuid }, appIntentsGroupKey);
    }

    return config;
  });
}

const withAppIntents = (config) => {
  config = withCopyAppIntents(config);
  config = withRegisterAppIntents(config);
  return config;
};

module.exports = withAppIntents;
