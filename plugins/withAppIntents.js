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

    // Chercher le sous-groupe source par PATH (ex: path = 'WalletBalanceAssistant')
    // et non par name, pour éviter de retomber sur le groupe racine.
    // Ce groupe a path = projectName et est ancré dans ios/ → ios/WalletBalanceAssistant/
    const sourceGroupKey = proj.findPBXGroupKey({ path: projectName });

    // Créer le groupe AppIntents avec path = 'AppIntents' (relatif au parent)
    // → si parent = ios/WalletBalanceAssistant/, le groupe résout à ios/WalletBalanceAssistant/AppIntents/
    const { uuid: appIntentsGroupKey } = proj.addPbxGroup([], 'AppIntents', 'AppIntents');

    // Rattacher le groupe AppIntents au sous-groupe source
    if (sourceGroupKey) {
      const sourceGroup = proj.getPBXGroupByKey(sourceGroupKey);
      if (sourceGroup && sourceGroup.children) {
        sourceGroup.children.push({ value: appIntentsGroupKey, comment: 'AppIntents' });
      }
    }

    // Ajouter chaque fichier avec uniquement le NOM (relatif au groupe AppIntents)
    // → Xcode résout : ios/WalletBalanceAssistant/AppIntents/<fileName>
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
