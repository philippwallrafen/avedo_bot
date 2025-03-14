// ~/website/src/routes/log-router.ts
import { Router } from "express";
import { asyncHandler } from "../utils/async-handler.js";
import { log } from "../server-logger.js";
export const logRouter = Router();
// Log-Routen: POST /log
logRouter.post("/", asyncHandler(async (req, res) => {
    const { level, message, source: _source = "client" } = req.body;
    if (!level || !message) {
        res.status(400).json({ error: "Level und Message sind erforderlich" });
        return;
    }
    await log(level, message, "client"); // vorerst wird alles als 'client geflagged, egal welche 'source'
    res.json({ success: true });
}));
