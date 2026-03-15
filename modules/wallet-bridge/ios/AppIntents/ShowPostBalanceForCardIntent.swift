import AppIntents
import Foundation
import UserNotifications

/// Intent iOS pour afficher le solde post-paiement Apple Pay.
/// Déclenché via l'automatisation Raccourcis : transaction Apple Pay détectée.
@available(iOS 16.0, *)
struct ShowPostBalanceForCardIntent: AppIntent {
    
    static var title: LocalizedStringResource = "Afficher le solde après paiement"
    static var description: IntentDescription = "Affiche le solde du compte associé à une carte Wallet après un paiement."
    static var openAppWhenRun: Bool = false
    
    /// Label de la carte Wallet (passé par l'automatisation Raccourcis).
    @Parameter(title: "Nom de la carte")
    var cardLabel: String
    
    private let appGroupID = "group.com.walletbalance.assistant"
    private let tokenKey = "session_token"
    private let apiBaseURL = "https://app-bank-ios.onrender.com"
    
    func perform() async throws -> some IntentResult {
        let defaults = UserDefaults(suiteName: appGroupID)
        
        // 1. Chercher dans le cache local le mapping carte → compte
        let cacheKey = "card_mapping_\(cardLabel)"
        let cachedJSON = defaults?.string(forKey: cacheKey)
        
        if let jsonData = cachedJSON?.data(using: .utf8) {
            let cardBalance = try? JSONDecoder().decode(CachedCardBalance.self, from: jsonData)
            if let cardBalance = cardBalance {
                let cacheTimestamp = defaults?.double(forKey: "\(cacheKey)_timestamp") ?? 0
                let minutesAgo = Int((Date().timeIntervalSince1970 - cacheTimestamp) / 60)
                await sendPostNotification(cardBalance: cardBalance, minutesAgo: minutesAgo)
            }
        } else {
            // Carte non configurée
            await sendCardNotConfiguredNotification(cardLabel: cardLabel)
        }
        
        // 2. Tenter un refresh API en background
        if let token = KeychainReader.load(key: tokenKey, appGroup: appGroupID) {
            Task {
                await refreshCardBalanceFromAPI(token: token, cardLabel: cardLabel, defaults: defaults)
            }
        }
        
        return .result()
    }
    
    /// Envoie la notification de solde post-paiement.
    private func sendPostNotification(cardBalance: CachedCardBalance, minutesAgo: Int) async {
        let content = UNMutableNotificationContent()
        
        if cardBalance.privacyMode {
            content.title = "✅ Paiement détecté"
            content.body = "Solde disponible ✓"
        } else {
            content.title = "✅ Paiement détecté"
            let formatted = formatAmount(cardBalance.amount, currency: cardBalance.currency)
            content.body = "Solde \(cardBalance.accountLabel) : \(formatted)\n(maj il y a \(minutesAgo) min)"
        }
        
        content.sound = .default
        content.interruptionLevel = .timeSensitive
        
        let request = UNNotificationRequest(
            identifier: "post-balance-\(UUID().uuidString)",
            content: content,
            trigger: nil
        )
        
        try? await UNUserNotificationCenter.current().add(request)
    }
    
    /// Envoie une notification quand la carte n'est pas configurée.
    private func sendCardNotConfiguredNotification(cardLabel: String) async {
        let content = UNMutableNotificationContent()
        content.title = "⚠️ Carte non configurée"
        content.body = "Associez \"\(cardLabel)\" à un compte dans l'app."
        content.sound = .default
        
        let request = UNNotificationRequest(
            identifier: "card-not-configured-\(UUID().uuidString)",
            content: content,
            trigger: nil
        )
        
        try? await UNUserNotificationCenter.current().add(request)
    }
    
    /// Rafraîchit le solde depuis l'API.
    private func refreshCardBalanceFromAPI(token: String, cardLabel: String, defaults: UserDefaults?) async {
        guard let encodedLabel = cardLabel.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed),
              let url = URL(string: "\(apiBaseURL)/api/v1/balances/by-wallet-card?cardLabel=\(encodedLabel)") else { return }
        
        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        request.setValue("1.0.0", forHTTPHeaderField: "X-API-Version")
        request.timeoutInterval = 5
        
        guard let (data, response) = try? await URLSession.shared.data(for: request),
              let httpResponse = response as? HTTPURLResponse,
              httpResponse.statusCode == 200 else { return }
        
        // Mettre à jour le cache
        let cacheKey = "card_mapping_\(cardLabel)"
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

// ─── Types ───────────────────────────────────────────────

struct CachedCardBalance: Codable {
    let accountLabel: String
    let amount: Double
    let currency: String
    let privacyMode: Bool
}
