// ~/website/src/routes/root-router.ts

import { Router } from 'express';
import { asyncHandler } from '../utils/async-handler.js';
import { log } from '../server-logger.js';
import { loadAndValidateAgents } from '../csv-service.js';

export const rootRouter = Router();

// GET /
rootRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    await log('info', 'Root route accessed');
    try {
      const agents = await loadAndValidateAgents();
      res.render('index', { agents });
    } catch (error) {
      log('error', `❌ Fehler beim Laden der Agenten: ${error}`);
      res.status(500).send('Fehler beim Laden der Agenten.');
    }
  })
);
