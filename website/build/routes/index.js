// ~/website/src/routes/index.ts
import { Router } from "express";
import rootRoutes from "./rootRoutes.js";
import logRoutes from "./logRoutes.js";
import agentRoutes from "./agentRoutes.js";
const router = Router();
router.use("/", rootRoutes);
router.use("/logs", logRoutes);
router.use("/agents", agentRoutes);
export default router;
