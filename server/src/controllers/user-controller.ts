import { Request, Response } from "express";
import { IUser } from "../models/user-model.js"; // Import your interface

export const RegisterAndLoginUsingLinkedIn = async (
  req: Request,
  res: Response,
) => {
  try {
    const user = req.user as IUser; // Cast to your updated interface

    if (!user) {
      return res.redirect(
        `${process.env.CLIENT_SIDE_URL}/register?error=NoUser`,
      );
    }

    // 1. Generate Both Tokens
    const accessToken = user.createAccessToken();
    const refreshToken = user.createRefreshToken();

    // 2. (Optional but recommended) Save the refresh token to the database
    user.refreshToken = refreshToken;
    await user.save();

    // 3. Send both tokens to the Next.js Proxy
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
