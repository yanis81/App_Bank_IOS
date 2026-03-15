import AppIntents
import Foundation
import UserNotifications

/// Intent iOS pour afficher les soldes pré-paiement.
/// Déclenché via l'automatisation Raccourcis : ouverture de l'app Wallet.
@available(iOS 16.0, *)
struct ShowPreBalanceNotificationIntent: AppIntent {
    
    static var title: LocalizedStringResource = "Afficher les soldes"
    static var description: IntentDescription = "Affiche une notification avec vos soldes bancaires."
    static var openAppWhenRun: Bool = false
    
    private let appGroupID = "group.com.walletbalance.assistant"
    private let cacheKey = "cached_balances"
    private let tokenKey = "session_token"
    private let apiBaseURL = "https://app-bank-ios.onrender.com"
    
    func perform() async throws -> some IntentResult {
        // 1. Lire les soldes depuis le cache local (< 1 seconde)
        let defaults = UserDefaults(suiteName: appGroupID)
        let cachedJSON = defaults?.string(forKey: cacheKey)
        let cacheTimestamp = defaults?.double(forKey: "\(cacheKey)_timestamp") ?? 0
        
        if let jsonData = cachedJSON?.data(using: .utf8) {
            let balances = try? JSONDecoder().decode(CachedBalances.self, from: jsonData)
            if let balances = balances {
                let minutesAgo = Int((Date().timeIntervalSince1970 - cacheTimestamp) / 60)
                await sendNotification(balances: balances, minutesAgo: minutesAgo)
            }
        }
        
        // 2. En parallèle, tenter un refresh API si un token est disponible
        if let token = KeychainReader.load(key: tokenKey, appGroup: appGroupID) {
            Task {
                await refreshBalancesFromAPI(token: token, defaults: defaults)
            }
        }
        
        return .result()
    }
    
    /// Envoie la notification locale avec les soldes.
    private func sendNotification(balances: CachedBalances, minutesAgo: Int) async {
        let content = UNMutableNotificationContent()
        
        if balances.privacyMode {
            content.title = "💳 Solde disponible ✓"
            content.body = "Ouvrez l'app pour voir vos soldes."
        } else {
            content.title = "💳 Soldes (maj \(minutesAgo) min)"
            var body = ""
            for account in balances.accounts {
                let formatted = formatAmount(account.amount, currency: account.currency)
                body += "• \(account.label) : \(formatted)\n"
            }
            content.body = body.trimmingCharacters(in: .whitespacesAndNewlines)
        }
        
        content.sound = .default
        content.interruptionLevel = .timeSensitive
        
        let request = UNNotificationRequest(
            identifier: "pre-balance-\(UUID().uuidString)",
            content: content,
            trigger: nil
        )
        
        try? await UNUserNotificationCenter.current().add(request)
    }
    
    /// Rafraîchit les soldes depuis l'API backend.
    private func refreshBalancesFromAPI(token: String, defaults: UserDefaults?) async {
        guard let url = URL(string: "\(apiBaseURL)/api/v1/balances/summary") else { return }
        
        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        request.setValue("1.0.0", forHTTPHeaderField: "X-API-Version")
        request.timeoutInterval = 5
        
        guard let (data, response) = try? await URLSession.shared.data(for: request),
              let httpResponse = response as? HTTPURLResponse,
              httpResponse.statusCode == 200 else { return }
        
        // Mettre à jour le cache
        if let json = String(data: data, encoding: .utf8) {
            defaults?.set(json, forKey: cacheKey)
            defaults?.set(Date().timeIntervalSince1970, forKey: "\(cacheKey)_timestamp")
        }
    }
    
    /// Formate un montant avec sa devise.
    private func formatAmount(_ amount: Double, currency: String) -> String {
        let formatter = NumberFormatter()
        formatter.numberStyle = .currency
        formatter.currencyCode = currency
        formatter.maximumFractionDigits = 2
        return formatter.string(from: NSNumber(value: amount)) ?? "\(amount) \(currency)"
    }
}

// ─── Types partagés ──────────────────────────────────────

struct CachedBalances: Codable {
    let accounts: [CachedBalanceItem]
    let privacyMode: Bool
}

struct CachedBalanceItem: Codable {
    let label: String
    let amount: Double
    let currency: String
}

// ─── Keychain Reader (pour App Intents) ──────────────────

enum KeychainReader {
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
}
