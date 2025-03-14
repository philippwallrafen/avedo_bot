// ~/website/src/routes/agent-router.ts
import { Router } from "express";
import { loadAndValidateAgents, saveAgents, updateAgents } from "../csv-service.js";
import { log } from "../server-logger.js";
import { asyncHandler } from "../utils/async-handler.js";
export const agentRouter = Router();
// POST /update-agent-priority
agentRouter.post("/update-priority", asyncHandler(async (req, res) => {
    const { updatedCount, message } = await updateAgents(req.body, (agent, { priority }) => {
        if (priority === undefined || agent.priority === priority)
            return false;
        agent.priority = priority;
        return true;
    }, "Prioritäten erfolgreich aktualisiert und sortiert!", true);
    await saveAgents(await loadAndValidateAgents());
    res.json({ updatedCount, message });
}));
// POST /update-agent-skills
agentRouter.post("/update-skills", asyncHandler(async (req, res) => {
    const { updatedCount, message } = await updateAgents(req.body, (agent, { skill_ib, skill_ob }) => {
        log("debug", `🔄 Prüfe Agenten-Update: ${agent.surname}, ${agent.name}`);
        log("debug", `   ➝ Aktuell: skill_ib=${agent.skill_ib}, skill_ob=${agent.skill_ob}`);
        log("debug", `   ➝ Neu:     skill_ib=${skill_ib}, skill_ob=${skill_ob}`);
        if (agent.skill_ib === skill_ib && agent.skill_ob === skill_ob) {
            log("warn", `❌ Keine Änderung nötig: ${agent.surname}, ${agent.name}`);
            return false;
        }
        log("info", `✅ Aktualisiert: ${agent.surname}, ${agent.name}`);
        Object.assign(agent, { skill_ib, skill_ob });
        return true;
    }, "Agenten-Skills erfolgreich aktualisiert!");
    res.json({ updatedCount, message });
}));
