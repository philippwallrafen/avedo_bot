// ~/website/src/routes/log-router.ts
import { Router } from 'express';
import { asyncHandler } from '../utils/async-handler.js';
import { log } from '../server-logger.js';
export const logRouter = Router();
// Log-Routen: POST /log
logRouter.post(
  '/',
  asyncHandler(async (req, res) => {
    const { level, message, source: _source = 'client' } = req.body;
    if (!level || !message) {
      res.status(400).json({ error: 'Level und Message sind erforderlich' });
      return;
    }
    await log(level, message, 'client'); // vorerst wird alles als 'client geflagged, egal welche 'source'
    res.json({ success: true });
  })
);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibG9nLXJvdXRlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9yb3V0ZXMvbG9nLXJvdXRlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxxQ0FBcUM7QUFFckMsT0FBTyxFQUFFLE1BQU0sRUFBRSxNQUFNLFNBQVMsQ0FBQztBQUNqQyxPQUFPLEVBQUUsWUFBWSxFQUFFLE1BQU0sMkJBQTJCLENBQUM7QUFDekQsT0FBTyxFQUFFLEdBQUcsRUFBRSxNQUFNLHFCQUFxQixDQUFDO0FBUzFDLE1BQU0sQ0FBQyxNQUFNLFNBQVMsR0FBRyxNQUFNLEVBQUUsQ0FBQztBQUVsQyx3QkFBd0I7QUFDeEIsU0FBUyxDQUFDLElBQUksQ0FDWixHQUFHLEVBQ0gsWUFBWSxDQUFjLEtBQUssRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEVBQUU7SUFDM0MsTUFBTSxFQUFFLEtBQUssRUFBRSxPQUFPLEVBQUUsTUFBTSxFQUFFLE9BQU8sR0FBRyxRQUFRLEVBQUUsR0FBRyxHQUFHLENBQUMsSUFBSSxDQUFDO0lBQ2hFLElBQUksQ0FBQyxLQUFLLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQztRQUN2QixHQUFHLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxFQUFFLEtBQUssRUFBRSxxQ0FBcUMsRUFBRSxDQUFDLENBQUM7UUFDdkUsT0FBTztJQUNULENBQUM7SUFFRCxNQUFNLEdBQUcsQ0FBQyxLQUFLLEVBQUUsT0FBTyxFQUFFLFFBQVEsQ0FBQyxDQUFDLENBQUMsaUVBQWlFO0lBQ3RHLEdBQUcsQ0FBQyxJQUFJLENBQUMsRUFBRSxPQUFPLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQztBQUM5QixDQUFDLENBQUMsQ0FDSCxDQUFDIn0=
