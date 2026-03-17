import { Request, Response } from "express";
import UserModel, { IUser } from "../models/user-model.js";
import jwt from "jsonwebtoken";

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

    user.refreshToken = refreshToken;
    await user.save();

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
    const userID = req.user as any;

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

export const RefreshAccessToken = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const refreshToken = req.cookies?.agentx_refresh_token;

    if (!refreshToken) {
      res.status(401).json({ error: "Unauthorized. No Refresh Token found." });
      return;
    }

    // 2. Verify the refresh token
    const decoded = jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET as string,
    ) as { id: string };

    // 3. Find the user and verify the token hasn't been revoked
    const user = await UserModel.findById(decoded.id);

    if (!user || user.refreshToken !== refreshToken) {
      res
        .status(403)
        .json({ error: "Forbidden. Invalid or revoked refresh token." });
      return;
    }

    // 4. Generate a brand new Access Token
    const newAccessToken = user.createAccessToken();

    // 5. Send it back to the frontend
    res.status(200).json({ accessToken: newAccessToken });
    return;
  } catch (error: any) {
    console.error("Refresh Token Error:", error.message);
    res.status(403).json({ error: "Forbidden. Token expired or invalid." });
    return;
  }
};

export const UpdateUserProfile = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const jwtPayload = req.user as { id: string };
    const { headline, location, profileUrl } = req.body;

    if (!jwtPayload || !jwtPayload.id) {
      res.status(401).json({ error: "Unauthorized." });
      return;
    }

    const updatedUser = await UserModel.findByIdAndUpdate(
      jwtPayload.id,
      {
        ...(headline && { headline }),
        ...(location && { location }),
        ...(profileUrl && { profileUrl }),
      },
      { new: true },
    ).select("-refreshToken");

    res.status(200).json({ user: updatedUser });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
