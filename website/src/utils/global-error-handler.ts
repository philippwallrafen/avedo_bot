// ~/website/src/utils/global-error-handler.ts

import { Request, Response, NextFunction } from 'express';
import { log } from '../server-logger.js';

export function globalErrorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
  log('error', `❌ Fehler in ${req.method} ${req.url}: ${String(err)}`);
  res.status(500).json({ error: 'Interner Serverfehler', details: String(err) });
}
