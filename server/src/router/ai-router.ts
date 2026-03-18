import { Router } from "express";
import { AgentXAI } from "../controllers/ai-controller.js";
import AuthMiddleware from "../middlewares/auth-middleware.js";

const aiRouter = Router();

aiRouter.post("/agentx", AuthMiddleware, AgentXAI);

export default aiRouter;
