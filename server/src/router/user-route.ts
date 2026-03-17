import { Router } from "express";
import {
  GetUserDetails,
  RefreshAccessToken,
  RegisterAndLoginUsingLinkedIn,
  UpdateUserProfile,
} from "../controllers/user-controller.js";
import passport from "../lib/passport.js";
import AuthMiddleware from "../middlewares/auth-middleware.js";

const userRouter = Router();

userRouter.get(
  "/linkedin",
  passport.authenticate("linkedin", {
    state: true,
    scope: ["openid", "profile", "email"],
  } as any),
);

userRouter.get(
  "/linkedin/callback",
  passport.authenticate("linkedin", {
    failureRedirect: `${process.env.CLIENT_SIDE_URL}/register?error=AuthFailed`,
  } as any),
  RegisterAndLoginUsingLinkedIn,
);

userRouter.get("/me", AuthMiddleware, GetUserDetails);
userRouter.put("/me", UpdateUserProfile);

userRouter.get("/refresh", RefreshAccessToken);

export default userRouter;
