/**
 * Config plugin Expo — Ajoute les App Intents Swift au target principal iOS.
 *
 * POURQUOI ce plugin est nécessaire :
 * Les App Intents compilés dans un pod Expo (framework séparé) ne sont PAS
 * découverts par le build phase "Extract App Intents Metadata" d'Xcode.
 * iOS Raccourcis ne voit donc jamais les intents.
 * Ce plugin copie les fichiers Swift dans le target principal de l'app afin
 * qu'Xcode les inclue dans l'extraction des métadonnées.
 */

const { withXcodeProject, withDangerousMod } = require('@expo/config-plugins');
const path = require('path');
const fs = require('fs');

const APP_INTENTS_SOURCE_DIR = 'app-intents';
const APP_INTENTS_GROUP_NAME = 'AppIntents';

/**
 * Étape 1 : copie physique des fichiers Swift dans le dossier iOS généré.
 * S'exécute pendant le prebuild, avant la compilation Xcode.
 */
function withCopyAppIntents(config) {
  return withDangerousMod(config, [
    'ios',
    async (config) => {
      const projectRoot = config.modRequest.projectRoot;
      const platformRoot = config.modRequest.platformProjectRoot;
      const projectName = config.modRequest.projectName;

      const sourceDir = path.join(projectRoot, APP_INTENTS_SOURCE_DIR);
      if (!fs.existsSync(sourceDir)) {
        console.warn('[withAppIntents] Dossier app-intents/ introuvable — App Intents ignorés.');
        return config;
      }

      const destDir = path.join(platformRoot, projectName, APP_INTENTS_GROUP_NAME);
      if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
      }

      const swiftFiles = fs.readdirSync(sourceDir).filter((f) => f.endsWith('.swift'));
      for (const file of swiftFiles) {
        fs.copyFileSync(path.join(sourceDir, file), path.join(destDir, file));
      }

      console.log(`[withAppIntents] ${swiftFiles.length} fichier(s) copié(s) dans ${projectName}/AppIntents/`);
      return config;
    },
  ]);
}

/**
 * Étape 2 : enregistrement des fichiers dans le projet Xcode (.pbxproj).
 * Ajoute les références de fichiers et les intègre à la phase de compilation
 * du target principal, ce qui déclenche "Extract App Intents Metadata".
 */
function withRegisterAppIntents(config) {
  return withXcodeProject(config, (config) => {
    const xcodeProject = config.modResults;
    const projectRoot = config.modRequest.projectRoot;
    const projectName = config.modRequest.projectName;

    const sourceDir = path.join(projectRoot, APP_INTENTS_SOURCE_DIR);
    if (!fs.existsSync(sourceDir)) {
      return config;
    }

    const swiftFiles = fs.readdirSync(sourceDir).filter((f) => f.endsWith('.swift'));
    const mainTargetUuid = xcodeProject.getFirstTarget().uuid;

    // Trouver le groupe principal du projet (ex: "WalletBalanceAssistant")
    const mainGroupKey = xcodeProject.findPBXGroupKey({ name: projectName });

    // Créer le sous-groupe "AppIntents" s'il n'existe pas déjà
    let appIntentsGroupKey = xcodeProject.findPBXGroupKey({ name: APP_INTENTS_GROUP_NAME });
    if (!appIntentsGroupKey) {
      const result = xcodeProject.addPbxGroup([], APP_INTENTS_GROUP_NAME, APP_INTENTS_GROUP_NAME);
      appIntentsGroupKey = result.uuid;

      // Rattacher le groupe au groupe principal
      const mainGroup = xcodeProject.getPBXGroupByKey(mainGroupKey);
      if (mainGroup) {
        mainGroup.children.push({ value: appIntentsGroupKey, comment: APP_INTENTS_GROUP_NAME });
      }
    }

    for (const fileName of swiftFiles) {
      const pbxPath = `${projectName}/AppIntents/${fileName}`;

      // Éviter les doublons
      if (xcodeProject.pbxFileByPath(pbxPath)) {
        continue;
      }

      xcodeProject.addSourceFile(pbxPath, { target: mainTargetUuid }, appIntentsGroupKey);
    }

    return config;
  });
}

/**
 * Plugin principal — compose les deux étapes.
 */
const withAppIntents = (config) => {
  config = withCopyAppIntents(config);
  config = withRegisterAppIntents(config);
  return config;
};

module.exports = withAppIntents;
