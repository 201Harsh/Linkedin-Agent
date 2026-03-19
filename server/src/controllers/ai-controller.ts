import { Request, Response } from "express";
import { AgentX } from "../main/AgentX.js";
import UserModel from "../models/user-model.js";
import { ChatModel } from "../models/chat-model.js";

// Helper to manage the 50/day rate limit
const checkRateLimit = async (user: any) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (!user.lastAiRequestDate || user.lastAiRequestDate < today) {
    user.dailyAiRequests = 1;
    user.lastAiRequestDate = today;
  } else {
    if (user.dailyAiRequests >= 50) return false;
    user.dailyAiRequests += 1;
  }

  await user.save();
  return true;
};

export const AgentXAI = async (req: Request, res: Response): Promise<void> => {
  try {
    const { prompt } = req.body;
    const userID = req.user as any;

    if (!userID) {
      res
        .status(401)
        .json({ error: "Unauthorized Access. Please Login First !" });
      return;
    }

    if (!prompt || typeof prompt !== "string") {
      res
        .status(400)
        .json({ error: "Prompt is required. Please provide a valid prompt." });
      return;
    }

    const user = await UserModel.findById(userID.id);
    if (!user) {
      res.status(404).json({ error: "User not found." });
      return;
    }

    const canProceed = await checkRateLimit(user);
    if (!canProceed) {
      res.status(429).json({
        error: "Daily limit of 50 AI requests reached. Try again tomorrow.",
      });
      return;
    }

    // 2. Save User Prompt to History (Casting ObjectId to String)
    await ChatModel.create({
      userId: user._id.toString(),
      role: "user",
      content: prompt,
    });

    const chatHistory = await ChatModel.find({ userId: user._id.toString() })
      .sort({ createdAt: 1 })
      .limit(12);

    const response = await AgentX({ user, chatHistory });

    // 5. Save AI Response to History (Casting ObjectId to String)
    await ChatModel.create({
      userId: user._id.toString(),
      role: "assistant",
      content: response,
    });
    res.status(200).json({ response });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

export const getChatHistory = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const userID = req.user as any;
    if (!userID) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const queryId = userID.id.toString();
    const chats = await ChatModel.find({ userId: queryId }).sort({
      createdAt: 1,
    });

    res.status(200).json({ chats });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch chats" });
  }
};
