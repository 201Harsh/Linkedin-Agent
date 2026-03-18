import AgentX from "../main/AgentX.js";
import { Request, Response } from "express";
import UserModel from "../models/user-model.js";

export const AgentXAI = async (req: Request, res: Response) => {
  try {
    const { prompt } = req.body;
    const userID = req.user as any;

    if (!userID) {
      res.status(401).json({
        error: "Unauthorized Access. Please Login First !",
      });
      return;
    }

    if (!prompt || typeof prompt !== "string") {
      res.status(400).json({
        error: "Prompt is required. Please provide a valid prompt.",
      });
      return;
    }

    const user = await UserModel.findById(userID.id);

    if (!user) {
      res.status(404).json({
        error: "User not found.",
      });
      return;
    }

    // Pass the user data into the Agent!
    const response = await AgentX({ prompt, user });

    res.status(200).json({
      response,
    });
    return;
  } catch (error: any) {
    res.status(500).json({
      error: error.message,
    });
    return;
  }
};
