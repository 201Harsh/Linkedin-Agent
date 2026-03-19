import { Schema, model, Document } from "mongoose";

export interface IChat extends Document {
  userId: string;
  role: "user" | "assistant";
  content: string;
  createdAt: Date;
}

const chatSchema = new Schema<IChat>(
  {
    userId: { type: String, required: true, ref: "User" },
    role: { type: String, enum: ["user", "assistant"], required: true },
    content: { type: String, required: true },
  },
  { timestamps: true },
);

export const ChatModel = model<IChat>("Chat", chatSchema);
