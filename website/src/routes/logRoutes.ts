// ~/website/src/routes/logRoutes.ts

import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { log } from "../serverLogger.js";

// Interface für den Log-Request-Body
interface LogPostBody {
  level: string;
  message: string;
  source?: "server" | "client";
}

const router = Router();

// Log-Routen: POST /log
router.post(
  "/log",
  asyncHandler<LogPostBody>(async (req, res) => {
    const { level, message, source: _source = "client" } = req.body;
    if (!level || !message) {
      res.status(400).json({ error: "Level und Message sind erforderlich" });
      return;
    }

    await log(level, message, "client"); // vorerst wird alles als 'client geflagged, egal welche 'source'
    res.json({ success: true });
  })
);

export default router;
