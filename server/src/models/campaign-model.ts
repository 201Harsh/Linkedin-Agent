import mongoose, { Document, Schema } from "mongoose";

export interface ICampaign extends Document {
  userId: mongoose.Types.ObjectId | string;
  name: string;
  url: string;
  note: string;
  status: "pending" | "sent";
  createdAt: Date;
}

const campaignSchema = new Schema<ICampaign>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  name: { type: String, required: true },
  url: { type: String, required: true },
  note: { type: String, required: true },
  status: {
    type: String,
    enum: ["pending", "sent"],
    default: "pending",
  },
  createdAt: { type: Date, default: Date.now },
});

export const CampaignModel =
  mongoose.models.Campaign ||
  mongoose.model<ICampaign>("Campaign", campaignSchema);
