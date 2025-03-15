// ~/website/src/client/browser-logger-loglevel.ts
// import loglevel from "loglevel";
// @ts-expect-error Bundler wird später geadded
import loglevel from 'https://cdn.skypack.dev/loglevel';
const ALLOWED_LOG_LEVELS = ['error', 'warn', 'info', 'debug', 'trace'];
// `loglevel`-Logger für Client
const browserLogger = loglevel.getLogger('browser');
browserLogger.setLevel(loglevel.levels.DEBUG);
// Lookup-Table für die Log-Methoden
const logFunctionMap = {
  error: browserLogger.error.bind(browserLogger),
  warn: browserLogger.warn.bind(browserLogger),
  info: browserLogger.info.bind(browserLogger),
  debug: browserLogger.debug.bind(browserLogger),
  trace: browserLogger.trace.bind(browserLogger),
};
// Logging-Funktion
function log(level, message) {
  const validatedLevel = ALLOWED_LOG_LEVELS.includes(level)
    ? level
    : (console.error(`⚠️ Unbekanntes Log-Level: "${level}". Fallback auf "debug".`), 'debug');
  logFunctionMap[validatedLevel](message);
  sendLogToServer(validatedLevel, message);
}
async function sendLogToServer(level, message) {
  if (!navigator.onLine) {
    console.warn('📴 Kein Internet – Log wird nicht gesendet.');
    return;
  }
  try {
    await fetch('/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ level, message }),
    });
  } catch (error) {
    console.error('❌ Fehler beim Senden des Logs an den Server:', error);
  }
}
export default log;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYnJvd3Nlci1sb2dnZXItbG9nbGV2ZWwuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvY2xpZW50L2Jyb3dzZXItbG9nZ2VyLWxvZ2xldmVsLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLGtEQUFrRDtBQUVsRCxtQ0FBbUM7QUFDbkMsK0NBQStDO0FBQy9DLE9BQU8sUUFBUSxNQUFNLGtDQUFrQyxDQUFDO0FBRXhELE1BQU0sa0JBQWtCLEdBQUcsQ0FBQyxPQUFPLEVBQUUsTUFBTSxFQUFFLE1BQU0sRUFBRSxPQUFPLEVBQUUsT0FBTyxDQUFVLENBQUM7QUFHaEYsK0JBQStCO0FBQy9CLE1BQU0sYUFBYSxHQUFHLFFBQVEsQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLENBQUM7QUFDcEQsYUFBYSxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDO0FBRTlDLG9DQUFvQztBQUNwQyxNQUFNLGNBQWMsR0FBOEU7SUFDaEcsS0FBSyxFQUFFLGFBQWEsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQztJQUM5QyxJQUFJLEVBQUUsYUFBYSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDO0lBQzVDLElBQUksRUFBRSxhQUFhLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUM7SUFDNUMsS0FBSyxFQUFFLGFBQWEsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQztJQUM5QyxLQUFLLEVBQUUsYUFBYSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDO0NBQy9DLENBQUM7QUFFRixtQkFBbUI7QUFDbkIsU0FBUyxHQUFHLENBQUMsS0FBYSxFQUFFLE9BQWU7SUFDekMsTUFBTSxjQUFjLEdBQUcsa0JBQWtCLENBQUMsUUFBUSxDQUFDLEtBQWlCLENBQUM7UUFDbkUsQ0FBQyxDQUFFLEtBQWtCO1FBQ3JCLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsOEJBQThCLEtBQUssMEJBQTBCLENBQUMsRUFBRSxPQUFPLENBQUMsQ0FBQztJQUU1RixjQUFjLENBQUMsY0FBYyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUM7SUFFeEMsZUFBZSxDQUFDLGNBQWMsRUFBRSxPQUFPLENBQUMsQ0FBQztBQUMzQyxDQUFDO0FBRUQsS0FBSyxVQUFVLGVBQWUsQ0FBQyxLQUFlLEVBQUUsT0FBZTtJQUM3RCxJQUFJLENBQUMsU0FBUyxDQUFDLE1BQU0sRUFBRSxDQUFDO1FBQ3RCLE9BQU8sQ0FBQyxJQUFJLENBQUMsNkNBQTZDLENBQUMsQ0FBQztRQUM1RCxPQUFPO0lBQ1QsQ0FBQztJQUVELElBQUksQ0FBQztRQUNILE1BQU0sS0FBSyxDQUFDLE1BQU0sRUFBRTtZQUNsQixNQUFNLEVBQUUsTUFBTTtZQUNkLE9BQU8sRUFBRSxFQUFFLGNBQWMsRUFBRSxrQkFBa0IsRUFBRTtZQUMvQyxJQUFJLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxFQUFFLEtBQUssRUFBRSxPQUFPLEVBQUUsQ0FBQztTQUN6QyxDQUFDLENBQUM7SUFDTCxDQUFDO0lBQUMsT0FBTyxLQUFLLEVBQUUsQ0FBQztRQUNmLE9BQU8sQ0FBQyxLQUFLLENBQUMsOENBQThDLEVBQUUsS0FBSyxDQUFDLENBQUM7SUFDdkUsQ0FBQztBQUNILENBQUM7QUFFRCxlQUFlLEdBQUcsQ0FBQyJ9
