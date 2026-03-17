import {
  Schema as MongooseSchema,
  model,
  Document as MongooseDoc,
} from "mongoose";
import jwt from "jsonwebtoken";

// 1. Declare methods in the interface
export interface IUser extends MongooseDoc {
  linkedinId: string;
  name: string;
  email: string;
  avatar?: string;
  refreshToken?: string; // Storing this allows you to revoke access later
  createAccessToken: () => string;
  createRefreshToken: () => string;
}

const userSchema = new MongooseSchema<IUser>(
  {
    linkedinId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    avatar: { type: String, default: "" },
    refreshToken: { type: String }, // Added to schema
  },
  { timestamps: true },
);

// 2. Access Token (Short-lived, e.g., 15 minutes)
// Access Token
userSchema.methods.createAccessToken = function () {
  const options: jwt.SignOptions = {
    expiresIn: (process.env.JWT_ACCESS_EXPIRES_IN || "15m") as any,
  };

  return jwt.sign({ id: this._id }, process.env.JWT_SECRET as string, options);
};

// Refresh Token
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
