import { Request, Response } from "express";
import { CampaignModel } from "../models/campaign-model.js";

export const queueLead = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, url, note } = req.body;
    const userId = (req as any).user.id;

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

export const getQueueStatus = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const userId = (req as any).user.id;

    const queue = await CampaignModel.find({ userId }).sort({ createdAt: -1 });

    res.status(200).json({ queue });
  } catch (error) {
    console.error("Status error:", error);
    res.status(500).json({ error: "Failed to fetch queue status" });
  }
};

export const getNextLead = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const userId = (req as any).user.id;

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
