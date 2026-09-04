import { Request, Response } from "express";
import { CampaignModel } from "../models/campaign-model.js";

export const queueLead = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, url, note, message, connection_note, personalized_note } = req.body;
    const userId = (req as any).user?.id;

    if (!userId) {
      res.status(401).json({ error: "Unauthorized. Please log in." });
      return;
    }

    if (!url) {
      res.status(400).json({ error: "Lead URL is required" });
      return;
    }

    const leadName = name?.trim() || "LinkedIn Member";
    const leadNote =
      (note || message || connection_note || personalized_note || "").trim() ||
      `Hi ${leadName}, I came across your profile and would love to connect!`;

    // Prevent duplicate pending leads for the same URL and user
    const existing = await CampaignModel.findOne({
      userId,
      url,
      status: "pending",
    });

    if (existing) {
      res.status(200).json({ success: true, lead: existing, alreadyQueued: true });
      return;
    }

    const newLead = await CampaignModel.create({
      userId,
      name: leadName,
      url,
      note: leadNote,
      status: "pending",
    });

    console.log(`[Campaign] Queued lead: ${leadName} -> ${url}`);
    res.status(201).json({ success: true, lead: newLead });
  } catch (error: any) {
    console.error("Queue error:", error);
    res.status(500).json({ error: error?.message || "Failed to queue lead" });
  }
};

export const getQueueStatus = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const userId = (req as any).user?.id;

    const queue = await CampaignModel.find({ userId }).sort({ createdAt: -1 });

    res.status(200).json({ queue });
  } catch (error: any) {
    console.error("Status error:", error);
    res.status(500).json({ error: "Failed to fetch queue status" });
  }
};

export const getNextLead = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const userId = (req as any).user?.id;

    const nextLead = await CampaignModel.findOneAndUpdate(
      { userId, status: "pending" },
      { status: "sent" },
      { returnDocument: "after", sort: { createdAt: 1 } },
    );

    if (!nextLead) {
      res.status(404).json({ message: "No pending leads found." });
      return;
    }

    console.log(`[Campaign] Serving next lead to extension: ${nextLead.name} (${nextLead.url})`);
    res.status(200).json(nextLead);
  } catch (error: any) {
    console.error("Next lead error:", error);
    res.status(500).json({ error: "Failed to fetch next lead" });
  }
};
