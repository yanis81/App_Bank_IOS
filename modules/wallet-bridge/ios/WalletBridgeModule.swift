import ExpoModulesCore
import Foundation

/// Module natif pour le bridge Swift ↔ React Native.
/// Gère le cache partagé (App Group) pour les soldes et le token d'authentification.
public class WalletBridgeModule: Module {
    
    private let appGroupID = "group.com.walletbalance.assistant"
    private let cacheKey = "cached_balances"
    private let tokenKey = "session_token"
    
    private var sharedDefaults: UserDefaults? {
        return UserDefaults(suiteName: appGroupID)
    }
    
    public func definition() -> ModuleDefinition {
        Name("WalletBridge")
        
        // ─── Cache des soldes (App Group UserDefaults) ───────────
        
        /// Sauvegarde les soldes dans le cache partagé (accessible par les App Intents).
        Function("setCachedBalances") { (jsonString: String) -> Bool in
            guard let defaults = self.sharedDefaults else { return false }
            defaults.set(jsonString, forKey: self.cacheKey)
            defaults.set(Date().timeIntervalSince1970, forKey: "\(self.cacheKey)_timestamp")
            return true
        }
        
        /// Récupère les soldes depuis le cache partagé.
        Function("getCachedBalances") { () -> String? in
            return self.sharedDefaults?.string(forKey: self.cacheKey)
        }
        
        /// Récupère le timestamp du cache.
        Function("getCacheTimestamp") { () -> Double in
            return self.sharedDefaults?.double(forKey: "\(self.cacheKey)_timestamp") ?? 0
        }
        
        // ─── Token partagé (App Group Keychain) ──────────────────
        
        /// Sauvegarde le token dans le Keychain partagé (App Group).
        Function("setSharedToken") { (token: String) -> Bool in
            return KeychainHelper.save(key: self.tokenKey, value: token, appGroup: self.appGroupID)
        }
        
        /// Récupère le token depuis le Keychain partagé.
        Function("getSharedToken") { () -> String? in
            return KeychainHelper.load(key: self.tokenKey, appGroup: self.appGroupID)
        }
        
        /// Supprime le token du Keychain partagé.
        Function("deleteSharedToken") { () -> Bool in
            return KeychainHelper.delete(key: self.tokenKey, appGroup: self.appGroupID)
        }
        
        // ─── Utilitaires ─────────────────────────────────────────
        
        /// Vérifie si le module est opérationnel.
        Function("isAvailable") { () -> Bool in
            return self.sharedDefaults != nil
        }
    }
}

// ─── Keychain Helper ─────────────────────────────────────────

/// Helper pour les opérations Keychain avec App Group.
enum KeychainHelper {
    
    static func save(key: String, value: String, appGroup: String) -> Bool {
        guard let data = value.data(using: .utf8) else { return false }
        
        // Supprimer l'ancienne valeur
        delete(key: key, appGroup: appGroup)
        
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrAccount as String: key,
            kSecAttrAccessGroup as String: appGroup,
            kSecValueData as String: data,
            kSecAttrAccessible as String: kSecAttrAccessibleAfterFirstUnlock
        ]
        
        let status = SecItemAdd(query as CFDictionary, nil)
        return status == errSecSuccess
    }
    
    static func load(key: String, appGroup: String) -> String? {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrAccount as String: key,
            kSecAttrAccessGroup as String: appGroup,
            kSecReturnData as String: true,
            kSecMatchLimit as String: kSecMatchLimitOne
        ]
        
        var item: CFTypeRef?
        let status = SecItemCopyMatching(query as CFDictionary, &item)
        
        guard status == errSecSuccess, let data = item as? Data else { return nil }
        return String(data: data, encoding: .utf8)
    }
    
    @discardableResult
    static func delete(key: String, appGroup: String) -> Bool {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrAccount as String: key,
            kSecAttrAccessGroup as String: appGroup
        ]
        
        let status = SecItemDelete(query as CFDictionary)
        return status == errSecSuccess || status == errSecItemNotFound
    }
}
