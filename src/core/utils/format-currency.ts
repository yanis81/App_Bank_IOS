/**
 * Fonctions utilitaires pour le formatage de valeurs monétaires.
 *
 * @module core/utils/format-currency
 */

/**
 * Formate un montant en devise lisible (locale française par défaut).
 *
 * @param amount - Montant à formater.
 * @param currency - Code devise ISO 4217 (par défaut 'EUR').
 * @returns Le montant formaté (ex: "1 234,56 €").
 */
export function formatCurrency(amount: number, currency: string = 'EUR'): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Calcule et formate le temps écoulé en minutes depuis un timestamp.
 *
 * @param timestamp - Date ISO ou objet Date de référence. Retourne '-' si absent ou invalide.
 * @returns Texte lisible du type "il y a X min", ou '-' si le timestamp est invalide.
 */
export function formatTimeAgo(timestamp: string | Date | undefined | null): string {
  if (!timestamp) return '-';
  const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
  if (isNaN(date.getTime())) return '-';
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60_000);

  if (diffMin < 1) return 'à l\'instant';
  if (diffMin < 60) return `${diffMin} min`;

  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h`;

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}j`;
}
