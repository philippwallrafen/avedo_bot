// ~/website/src/client/browser-logger.ts
const ALLOWED_LOG_LEVELS = ['error', 'warn', 'info', 'log', 'debug', 'trace'];
// Lookup-Table für die Log-Methoden
const logFunctionMap = {
  error: console.error,
  warn: console.warn,
  info: console.info,
  log: console.log,
  debug: console.debug,
  trace: console.trace,
};
// Logging-Funktion
export function log(level, message, sendToServer = true) {
  if (!ALLOWED_LOG_LEVELS.includes(level)) {
    console.error(`⚠️ Unbekanntes Log-Level: "${level}". Fallback auf "log".`);
    level = 'log';
  }
  const validatedLevel = level;
  let flattenedMessage;
  if (Array.isArray(message)) {
    logFunctionMap[validatedLevel](...message);
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
async function sendLogToServer(level, message) {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYnJvd3Nlci1sb2dnZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvY2xpZW50L2Jyb3dzZXItbG9nZ2VyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLHlDQUF5QztBQUV6QyxNQUFNLGtCQUFrQixHQUFHLENBQUMsT0FBTyxFQUFFLE1BQU0sRUFBRSxNQUFNLEVBQUUsS0FBSyxFQUFFLE9BQU8sRUFBRSxPQUFPLENBQVUsQ0FBQztBQUd2RixvQ0FBb0M7QUFDcEMsTUFBTSxjQUFjLEdBQThFO0lBQ2hHLEtBQUssRUFBRSxPQUFPLENBQUMsS0FBSztJQUNwQixJQUFJLEVBQUUsT0FBTyxDQUFDLElBQUk7SUFDbEIsSUFBSSxFQUFFLE9BQU8sQ0FBQyxJQUFJO0lBQ2xCLEdBQUcsRUFBRSxPQUFPLENBQUMsR0FBRztJQUNoQixLQUFLLEVBQUUsT0FBTyxDQUFDLEtBQUs7SUFDcEIsS0FBSyxFQUFFLE9BQU8sQ0FBQyxLQUFLO0NBQ3JCLENBQUM7QUFFRixtQkFBbUI7QUFDbkIsTUFBTSxVQUFVLEdBQUcsQ0FBQyxLQUFhLEVBQUUsT0FBMEIsRUFBRSxlQUF3QixJQUFJO0lBQ3pGLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxRQUFRLENBQUMsS0FBaUIsQ0FBQyxFQUFFLENBQUM7UUFDcEQsT0FBTyxDQUFDLEtBQUssQ0FBQyw4QkFBOEIsS0FBSyx3QkFBd0IsQ0FBQyxDQUFDO1FBQzNFLEtBQUssR0FBRyxLQUFLLENBQUM7SUFDaEIsQ0FBQztJQUNELE1BQU0sY0FBYyxHQUFHLEtBQWlCLENBQUM7SUFDekMsSUFBSSxnQkFBd0IsQ0FBQztJQUU3QixJQUFJLEtBQUssQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQztRQUMzQixjQUFjLENBQUMsY0FBYyxDQUFDLENBQUMsR0FBSSxPQUFpQyxDQUFDLENBQUM7UUFDdEUsZ0JBQWdCLEdBQUcsT0FBTyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztJQUN2QyxDQUFDO1NBQU0sQ0FBQztRQUNOLGNBQWMsQ0FBQyxjQUFjLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUN4QyxnQkFBZ0IsR0FBRyxPQUFPLENBQUM7SUFDN0IsQ0FBQztJQUVELElBQUksQ0FBQyxZQUFZLEVBQUUsQ0FBQztRQUNsQixPQUFPO0lBQ1QsQ0FBQztJQUNELGVBQWUsQ0FBQyxjQUFjLEVBQUUsZ0JBQWdCLENBQUMsQ0FBQztBQUNwRCxDQUFDO0FBRUQsS0FBSyxVQUFVLGVBQWUsQ0FBQyxLQUFlLEVBQUUsT0FBZTtJQUM3RCxJQUFJLENBQUMsU0FBUyxDQUFDLE1BQU0sRUFBRSxDQUFDO1FBQ3RCLE9BQU8sQ0FBQyxJQUFJLENBQUMsNkNBQTZDLENBQUMsQ0FBQztRQUM1RCxPQUFPO0lBQ1QsQ0FBQztJQUVELElBQUksQ0FBQztRQUNILE1BQU0sUUFBUSxHQUFHLE1BQU0sS0FBSyxDQUFDLE9BQU8sRUFBRTtZQUNwQyxNQUFNLEVBQUUsTUFBTTtZQUNkLE9BQU8sRUFBRSxFQUFFLGNBQWMsRUFBRSxrQkFBa0IsRUFBRTtZQUMvQyxJQUFJLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxFQUFFLEtBQUssRUFBRSxPQUFPLEVBQUUsTUFBTSxFQUFFLFFBQVEsRUFBRSxDQUFDO1NBQzNELENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyxRQUFRLENBQUMsRUFBRSxFQUFFLENBQUM7WUFDakIsTUFBTSxJQUFJLEtBQUssQ0FBQyxrQ0FBa0MsUUFBUSxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUM7UUFDdkUsQ0FBQztJQUNILENBQUM7SUFBQyxPQUFPLEtBQUssRUFBRSxDQUFDO1FBQ2YsT0FBTyxDQUFDLEtBQUssQ0FBQyw4Q0FBOEMsRUFBRSxLQUFLLENBQUMsQ0FBQztJQUN2RSxDQUFDO0FBQ0gsQ0FBQyJ9
