// ~/website/src/client/browser-logger.ts

const ALLOWED_LOG_LEVELS = ['error', 'warn', 'info', 'log', 'debug', 'trace'] as const;
type LogLevel = (typeof ALLOWED_LOG_LEVELS)[number];

// Lookup-Table für die Log-Methoden
const logFunctionMap: Record<LogLevel, (message: string, ...optionalParams: unknown[]) => void> = {
  error: console.error,
  warn: console.warn,
  info: console.info,
  log: console.log,
  debug: console.debug,
  trace: console.trace,
};

// Logging-Funktion
export function log(level: string, message: string | string[], sendToServer: boolean = true): void {
  if (!ALLOWED_LOG_LEVELS.includes(level as LogLevel)) {
    console.error(`⚠️ Unbekanntes Log-Level: "${level}". Fallback auf "log".`);
    level = 'log';
  }
  const validatedLevel = level as LogLevel;
  let flattenedMessage: string;

  if (Array.isArray(message)) {
    logFunctionMap[validatedLevel](...(message as [string, ...string[]]));
    flattenedMessage = message.join(' ');
  } else {
    logFunctionMap[validatedLevel](message);
    flattenedMessage = message;
  }

  if (!sendToServer) {
    return;
  }
  sendLogToServer(validatedLevel, flattenedMessage);
}

async function sendLogToServer(level: LogLevel, message: string): Promise<void> {
  if (!navigator.onLine) {
    console.warn('📴 Kein Internet – Log wird nicht gesendet.');
    return;
  }

  try {
    const response = await fetch('/logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ level, message, source: 'client' }),
    });

    if (!response.ok) {
      throw new Error(`❌ Server antwortete mit Status ${response.status}`);
    }
  } catch (error) {
    console.error('❌ Fehler beim Senden des Logs an den Server:', error);
  }
}
