/**
 * Logger structuré de l'application.
 * Désactivé automatiquement en production.
 * Utiliser ce logger au lieu de console.log dans tout le projet.
 *
 * @module core/logger
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  readonly level: LogLevel;
  readonly message: string;
  readonly timestamp: string;
  readonly context?: Record<string, unknown>;
}

/**
 * Formate une entrée de log pour l'affichage console.
 */
function formatLog(entry: LogEntry): string {
  const ctx = entry.context ? ` ${JSON.stringify(entry.context)}` : '';
  return `[${entry.timestamp}] [${entry.level.toUpperCase()}] ${entry.message}${ctx}`;
}

/**
 * Crée une entrée de log structurée.
 */
function createEntry(level: LogLevel, message: string, context?: Record<string, unknown>): LogEntry {
  return {
    level,
    message,
    timestamp: new Date().toISOString(),
    context,
  };
}

/**
 * Affiche un log si l'environnement est en développement.
 */
function emit(entry: LogEntry): void {
  if (!__DEV__) return;

  const formatted = formatLog(entry);
  switch (entry.level) {
    case 'debug':
      // eslint-disable-next-line no-console
      console.debug(formatted);
      break;
    case 'info':
      // eslint-disable-next-line no-console
      console.info(formatted);
      break;
    case 'warn':
      // eslint-disable-next-line no-console
      console.warn(formatted);
      break;
    case 'error':
      // eslint-disable-next-line no-console
      console.error(formatted);
      break;
  }
}

export const logger = {
  /**
   * Log de debug (développement uniquement).
   *
   * @param message - Message de debug.
   * @param context - Données contextuelles optionnelles.
   */
  debug(message: string, context?: Record<string, unknown>): void {
    emit(createEntry('debug', message, context));
  },

  /**
   * Log d'information.
   *
   * @param message - Message informatif.
   * @param context - Données contextuelles optionnelles.
   */
  info(message: string, context?: Record<string, unknown>): void {
    emit(createEntry('info', message, context));
  },

  /**
   * Log d'avertissement.
   *
   * @param message - Message d'avertissement.
   * @param context - Données contextuelles optionnelles.
   */
  warn(message: string, context?: Record<string, unknown>): void {
    emit(createEntry('warn', message, context));
  },

  /**
   * Log d'erreur.
   *
   * @param message - Message d'erreur.
   * @param context - Données contextuelles optionnelles.
   */
  error(message: string, context?: Record<string, unknown>): void {
    emit(createEntry('error', message, context));
  },
} as const;
