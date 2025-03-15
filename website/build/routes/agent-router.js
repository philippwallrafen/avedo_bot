// ~/website/src/routes/agent-router.ts
import { Router } from 'express';
import { loadAndValidateAgents, saveAgents, updateAgents } from '../csv-service.js';
import { log } from '../server-logger.js';
import { asyncHandler } from '../utils/async-handler.js';
export const agentRouter = Router();
// POST /update-agent-priority
agentRouter.post(
  '/priority',
  asyncHandler(async (req, res) => {
    const { updatedCount, message } = await updateAgents(
      req.body,
      (agent, { priority }) => {
        if (priority === undefined || agent.priority === priority) return false;
        agent.priority = priority;
        return true;
      },
      'Prioritäten erfolgreich aktualisiert und sortiert!',
      true
    );
    await saveAgents(await loadAndValidateAgents());
    res.json({ updatedCount, message });
  })
);
// POST /update-agent-skills
agentRouter.post(
  '/skills',
  asyncHandler(async (req, res) => {
    const { updatedCount, message } = await updateAgents(
      req.body,
      (agent, { skill_ib, skill_ob }) => {
        log('debug', `🔄 Prüfe Agenten-Update: ${agent.surname}, ${agent.name}`);
        log('debug', `   ➝ Aktuell: skill_ib=${agent.skill_ib}, skill_ob=${agent.skill_ob}`);
        log('debug', `   ➝ Neu:     skill_ib=${skill_ib}, skill_ob=${skill_ob}`);
        if (agent.skill_ib === skill_ib && agent.skill_ob === skill_ob) {
          log('warn', `❌ Keine Änderung nötig: ${agent.surname}, ${agent.name}`);
          return false;
        }
        log('info', `✅ Aktualisiert: ${agent.surname}, ${agent.name}`);
        Object.assign(agent, { skill_ib, skill_ob });
        return true;
      },
      'Agenten-Skills erfolgreich aktualisiert!'
    );
    res.json({ updatedCount, message });
  })
);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWdlbnQtcm91dGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL3JvdXRlcy9hZ2VudC1yb3V0ZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsdUNBQXVDO0FBRXZDLE9BQU8sRUFBRSxNQUFNLEVBQUUsTUFBTSxTQUFTLENBQUM7QUFDakMsT0FBTyxFQUFTLHFCQUFxQixFQUFFLFVBQVUsRUFBRSxZQUFZLEVBQUUsTUFBTSxtQkFBbUIsQ0FBQztBQUMzRixPQUFPLEVBQUUsR0FBRyxFQUFFLE1BQU0scUJBQXFCLENBQUM7QUFDMUMsT0FBTyxFQUFFLFlBQVksRUFBRSxNQUFNLDJCQUEyQixDQUFDO0FBZXpELE1BQU0sQ0FBQyxNQUFNLFdBQVcsR0FBRyxNQUFNLEVBQUUsQ0FBQztBQUVwQyw4QkFBOEI7QUFDOUIsV0FBVyxDQUFDLElBQUksQ0FDZCxXQUFXLEVBQ1gsWUFBWSxDQUEyQixLQUFLLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxFQUFFO0lBQ3hELE1BQU0sRUFBRSxZQUFZLEVBQUUsT0FBTyxFQUFFLEdBQUcsTUFBTSxZQUFZLENBQ2xELEdBQUcsQ0FBQyxJQUFJLEVBQ1IsQ0FBQyxLQUFZLEVBQUUsRUFBRSxRQUFRLEVBQXlCLEVBQUUsRUFBRTtRQUNwRCxJQUFJLFFBQVEsS0FBSyxTQUFTLElBQUksS0FBSyxDQUFDLFFBQVEsS0FBSyxRQUFRO1lBQUUsT0FBTyxLQUFLLENBQUM7UUFDeEUsS0FBSyxDQUFDLFFBQVEsR0FBRyxRQUFRLENBQUM7UUFDMUIsT0FBTyxJQUFJLENBQUM7SUFDZCxDQUFDLEVBQ0Qsb0RBQW9ELEVBQ3BELElBQUksQ0FDTCxDQUFDO0lBQ0YsTUFBTSxVQUFVLENBQUMsTUFBTSxxQkFBcUIsRUFBRSxDQUFDLENBQUM7SUFDaEQsR0FBRyxDQUFDLElBQUksQ0FBQyxFQUFFLFlBQVksRUFBRSxPQUFPLEVBQUUsQ0FBQyxDQUFDO0FBQ3RDLENBQUMsQ0FBQyxDQUNILENBQUM7QUFFRiw0QkFBNEI7QUFDNUIsV0FBVyxDQUFDLElBQUksQ0FDZCxTQUFTLEVBQ1QsWUFBWSxDQUF1QixLQUFLLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxFQUFFO0lBQ3BELE1BQU0sRUFBRSxZQUFZLEVBQUUsT0FBTyxFQUFFLEdBQUcsTUFBTSxZQUFZLENBQ2xELEdBQUcsQ0FBQyxJQUFJLEVBQ1IsQ0FBQyxLQUFZLEVBQUUsRUFBRSxRQUFRLEVBQUUsUUFBUSxFQUE4QyxFQUFFLEVBQUU7UUFDbkYsR0FBRyxDQUFDLE9BQU8sRUFBRSw0QkFBNEIsS0FBSyxDQUFDLE9BQU8sS0FBSyxLQUFLLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQztRQUN6RSxHQUFHLENBQUMsT0FBTyxFQUFFLDBCQUEwQixLQUFLLENBQUMsUUFBUSxjQUFjLEtBQUssQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDO1FBQ3JGLEdBQUcsQ0FBQyxPQUFPLEVBQUUsMEJBQTBCLFFBQVEsY0FBYyxRQUFRLEVBQUUsQ0FBQyxDQUFDO1FBRXpFLElBQUksS0FBSyxDQUFDLFFBQVEsS0FBSyxRQUFRLElBQUksS0FBSyxDQUFDLFFBQVEsS0FBSyxRQUFRLEVBQUUsQ0FBQztZQUMvRCxHQUFHLENBQUMsTUFBTSxFQUFFLDJCQUEyQixLQUFLLENBQUMsT0FBTyxLQUFLLEtBQUssQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDO1lBQ3ZFLE9BQU8sS0FBSyxDQUFDO1FBQ2YsQ0FBQztRQUVELEdBQUcsQ0FBQyxNQUFNLEVBQUUsbUJBQW1CLEtBQUssQ0FBQyxPQUFPLEtBQUssS0FBSyxDQUFDLElBQUksRUFBRSxDQUFDLENBQUM7UUFDL0QsTUFBTSxDQUFDLE1BQU0sQ0FBQyxLQUFLLEVBQUUsRUFBRSxRQUFRLEVBQUUsUUFBUSxFQUFFLENBQUMsQ0FBQztRQUM3QyxPQUFPLElBQUksQ0FBQztJQUNkLENBQUMsRUFDRCwwQ0FBMEMsQ0FDM0MsQ0FBQztJQUNGLEdBQUcsQ0FBQyxJQUFJLENBQUMsRUFBRSxZQUFZLEVBQUUsT0FBTyxFQUFFLENBQUMsQ0FBQztBQUN0QyxDQUFDLENBQUMsQ0FDSCxDQUFDIn0=
