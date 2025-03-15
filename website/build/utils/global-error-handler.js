// ~/website/src/utils/global-error-handler.ts
import { log } from '../server-logger.js';
export function globalErrorHandler(err, req, res, _next) {
  log('error', `❌ Fehler in ${req.method} ${req.url}: ${String(err)}`);
  res.status(500).json({ error: 'Interner Serverfehler', details: String(err) });
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2xvYmFsLWVycm9yLWhhbmRsZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvdXRpbHMvZ2xvYmFsLWVycm9yLWhhbmRsZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsOENBQThDO0FBRzlDLE9BQU8sRUFBRSxHQUFHLEVBQUUsTUFBTSxxQkFBcUIsQ0FBQztBQUUxQyxNQUFNLFVBQVUsa0JBQWtCLENBQUMsR0FBWSxFQUFFLEdBQVksRUFBRSxHQUFhLEVBQUUsS0FBbUI7SUFDL0YsR0FBRyxDQUFDLE9BQU8sRUFBRSxlQUFlLEdBQUcsQ0FBQyxNQUFNLElBQUksR0FBRyxDQUFDLEdBQUcsS0FBSyxNQUFNLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxDQUFDO0lBQ3JFLEdBQUcsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEVBQUUsS0FBSyxFQUFFLHVCQUF1QixFQUFFLE9BQU8sRUFBRSxNQUFNLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxDQUFDO0FBQ2pGLENBQUMifQ==
