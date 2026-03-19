import {
  Schema as MongooseSchema,
  model,
  Document as MongooseDoc,
} from "mongoose";
import jwt from "jsonwebtoken";

export interface IUser extends MongooseDoc {
  linkedinId: string;
  name: string;
  email: string;
  avatar?: string;
  headline?: string;
  location?: string;
  connections?: number;
  profileUrl?: string; // <-- NEW: Directly from the /identityMe API
  refreshToken?: string;
  createAccessToken: () => string;
  createRefreshToken: () => string;
}

const userSchema = new MongooseSchema<IUser>(
  {
    linkedinId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    avatar: { type: String, default: "" },
    headline: { type: String, default: "AgentX User" },
    location: { type: String, default: "Not Specified" },
    connections: { type: Number, default: 0 },
    profileUrl: { type: String, default: "" },
    refreshToken: { type: String, select: false },
  },
  { timestamps: true },
);

userSchema.methods.createAccessToken = function () {
  const options: jwt.SignOptions = {
    expiresIn: (process.env.JWT_ACCESS_EXPIRES_IN || "15m") as any,
  };
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET as string, options);
};

userSchema.methods.createRefreshToken = function () {
  const options: jwt.SignOptions = {
    expiresIn: (process.env.JWT_REFRESH_EXPIRES_IN || "7d") as any,
  };
  return jwt.sign(
    { id: this._id },
    process.env.JWT_REFRESH_SECRET as string,
    options,
  );
};

const UserModel = model<IUser>("User", userSchema);
export default UserModel;
