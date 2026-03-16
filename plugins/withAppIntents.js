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

    // Créer le groupe "AppIntents" dans le projet Xcode
    const { uuid: appIntentsGroupKey } = proj.addPbxGroup([], 'AppIntents', 'AppIntents');

    // Rattacher ce groupe au groupe principal du projet
    const mainGroupKey = proj.findPBXGroupKey({ name: projectName });
    if (mainGroupKey) {
      const mainGroup = proj.getPBXGroupByKey(mainGroupKey);
      if (mainGroup && mainGroup.children) {
        mainGroup.children.push({ value: appIntentsGroupKey, comment: 'AppIntents' });
      }
    }

    for (const fileName of files) {
      const filePath = `${projectName}/AppIntents/${fileName}`;
      // addSourceFile avec group → utilise addFile (pas addPluginFile) → pas de crash
      proj.addSourceFile(filePath, { target: mainTargetUuid }, appIntentsGroupKey);
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
