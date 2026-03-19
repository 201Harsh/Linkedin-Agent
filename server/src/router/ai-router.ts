import { Router } from "express";
import { AgentXAI, getChatHistory } from "../controllers/ai-controller.js";
import AuthMiddleware from "../middlewares/auth-middleware.js";

const aiRouter = Router();

aiRouter.post("/agentx", AuthMiddleware, AgentXAI);
aiRouter.get("/chats", AuthMiddleware, getChatHistory);

export default aiRouter;
