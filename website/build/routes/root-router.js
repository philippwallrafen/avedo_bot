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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm9vdC1yb3V0ZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvcm91dGVzL3Jvb3Qtcm91dGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLHNDQUFzQztBQUV0QyxPQUFPLEVBQUUsTUFBTSxFQUFFLE1BQU0sU0FBUyxDQUFDO0FBQ2pDLE9BQU8sRUFBRSxZQUFZLEVBQUUsTUFBTSwyQkFBMkIsQ0FBQztBQUN6RCxPQUFPLEVBQUUsR0FBRyxFQUFFLE1BQU0scUJBQXFCLENBQUM7QUFDMUMsT0FBTyxFQUFFLHFCQUFxQixFQUFFLE1BQU0sbUJBQW1CLENBQUM7QUFFMUQsTUFBTSxDQUFDLE1BQU0sVUFBVSxHQUFHLE1BQU0sRUFBRSxDQUFDO0FBRW5DLFFBQVE7QUFDUixVQUFVLENBQUMsR0FBRyxDQUNaLEdBQUcsRUFDSCxZQUFZLENBQUMsS0FBSyxFQUFFLElBQUksRUFBRSxHQUFHLEVBQUUsRUFBRTtJQUMvQixNQUFNLEdBQUcsQ0FBQyxNQUFNLEVBQUUscUJBQXFCLENBQUMsQ0FBQztJQUN6QyxJQUFJLENBQUM7UUFDSCxNQUFNLE1BQU0sR0FBRyxNQUFNLHFCQUFxQixFQUFFLENBQUM7UUFDN0MsR0FBRyxDQUFDLE1BQU0sQ0FBQyxPQUFPLEVBQUUsRUFBRSxNQUFNLEVBQUUsQ0FBQyxDQUFDO0lBQ2xDLENBQUM7SUFBQyxPQUFPLEtBQUssRUFBRSxDQUFDO1FBQ2YsR0FBRyxDQUFDLE9BQU8sRUFBRSxvQ0FBb0MsS0FBSyxFQUFFLENBQUMsQ0FBQztRQUMxRCxHQUFHLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxnQ0FBZ0MsQ0FBQyxDQUFDO0lBQ3pELENBQUM7QUFDSCxDQUFDLENBQUMsQ0FDSCxDQUFDIn0=
