import { Request, Response } from "express";
import UserModel, { IUser } from "../models/user-model.js";

export const RegisterAndLoginUsingLinkedIn = async (
  req: Request,
  res: Response,
) => {
  try {
    const user = req.user as IUser;

    if (!user) {
      return res.redirect(
        `${process.env.CLIENT_SIDE_URL}/register?error=NoUser`,
      );
    }

    const accessToken = user.createAccessToken();
    const refreshToken = user.createRefreshToken();

    const nextJsApiUrl = `${process.env.CLIENT_SIDE_URL}/api/auth`;
    return res.redirect(
      `${nextJsApiUrl}?accessToken=${accessToken}&refreshToken=${refreshToken}`,
    );
  } catch (error) {
    console.error("LinkedIn Auth Error:", error);
    return res.redirect(
      `${process.env.CLIENT_SIDE_URL}/signin?error=AuthFailed`,
    );
  }
};

export const GetUserDetails = async (req: Request, res: Response) => {
  try {
    const userID = req.user as any

    if (!userID) {
      return res.status(401).json({
        error: "Unauthorized Access. Please Login First !",
      });
    }

    const user = await UserModel.findById(userID.id);

    return res.status(200).json({
      user: user,
    });
  } catch (error: any) {
    return res.status(500).json({
      error: error.message,
    });
  }
};
