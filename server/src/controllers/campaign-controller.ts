import { Request, Response } from "express";
import { CampaignModel } from "../models/campaign-model.js";

// 1. POST: Dashboard pushes a new lead to the database
export const queueLead = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, url, note } = req.body;
    const userId = (req as any).user.id; // Using your auth middleware's user ID

    const newLead = await CampaignModel.create({
      userId,
      name,
      url,
      note,
      status: "pending",
    });

    res.status(201).json({ success: true, lead: newLead });
  } catch (error) {
    console.error("Queue error:", error);
    res.status(500).json({ error: "Failed to queue lead" });
  }
};

// 2. GET: Dashboard gets all leads to show in the UI Animation
export const getQueueStatus = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const userId = (req as any).user.id;

    // Fetch all campaigns for this user, newest first
    const queue = await CampaignModel.find({ userId }).sort({ createdAt: -1 });

    res.status(200).json({ queue });
  } catch (error) {
    console.error("Status error:", error);
    res.status(500).json({ error: "Failed to fetch queue status" });
  }
};

// 3. GET: Chrome Extension silently pulls the next lead to execute
export const getNextLead = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const userId = (req as any).user.id; // Extracted safely from AuthMiddleware

    // Atomic execution: Find oldest pending lead FOR THIS EXACT USER and mark as sent
    const nextLead = await CampaignModel.findOneAndUpdate(
      { userId, status: "pending" },
      { status: "sent" },
      { new: true, sort: { createdAt: 1 } },
    );

    if (!nextLead) {
      res.status(404).json({ message: "No pending leads found." });
      return;
    }

    res.status(200).json(nextLead);
  } catch (error) {
    console.error("Next lead error:", error);
    res.status(500).json({ error: "Failed to fetch next lead" });
  }
};
