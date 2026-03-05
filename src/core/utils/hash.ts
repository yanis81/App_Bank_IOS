/**
 * Utilitaires de hashing pour la sécurité.
 * Utilisé côté frontend pour pré-hasher le token avant envoi si nécessaire,
 * et côté backend pour stocker les session tokens hashés.
 *
 * @module core/utils/hash
 */

import * as Crypto from 'expo-crypto';

/**
 * Génère un hash SHA-256 d'une chaîne de caractères.
 * Utilisé pour sécuriser les session tokens : le backend stocke le hash,
 * le client envoie le token brut, le backend hash et compare.
 *
 * @param input - Chaîne à hasher.
 * @returns Le hash SHA-256 en hexadécimal.
 */
export async function sha256(input: string): Promise<string> {
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, input);
}
