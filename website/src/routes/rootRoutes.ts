// ~/website/src/routes/rootRoutes.ts

import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import log from "../serverLogger.js";
import { loadAndValidateAgents } from "../csvService.js";

const router = Router();

// GET /
router.get(
  "/",
  asyncHandler(async (_req, res) => {
    await log("info", "Root route accessed");
    try {
      const agents = await loadAndValidateAgents();
      res.render("index", { agents });
    } catch (error) {
      log("error", `❌ Fehler beim Laden der Agenten: ${error}`);
      res.status(500).send("Fehler beim Laden der Agenten.");
    }
  })
);

export default router;
