// ~/website/src/routes/index.ts
import { Router } from "express";
import { rootRouter } from "./root-router.js";
import { logRouter } from "./log-router.js";
import { agentRouter } from "./agent-router.js";
export const router = Router();
router.use("/", rootRouter);
router.use("/logs", logRouter);
router.use("/agents", agentRouter);
