import { Router } from "express";
import {
  queueLead,
  getQueueStatus,
  getNextLead,
} from "../controllers/campaign-controller.js";
import AuthMiddleware from "../middlewares/auth-middleware.js";

const campaignRouter = Router();

campaignRouter.use(AuthMiddleware);

campaignRouter.post("/queue", queueLead);
campaignRouter.get("/queue/status", getQueueStatus);
campaignRouter.get("/queue/next", getNextLead);

export default campaignRouter;
