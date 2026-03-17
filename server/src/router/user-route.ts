import { Router } from "express";
import { RegisterAndLoginUsingLinkedIn } from "../controllers/user-controller.js";
import passport from "../lib/passport.js";

const userRouter = Router();

userRouter.get(
  "/linkedin",
  passport.authenticate("linkedin", {
    state: true,
    scope: ["openid", "profile", "email"], // MUST be exactly these three
  } as any),
);

userRouter.get(
  "/linkedin/callback",
  passport.authenticate("linkedin", {
    failureRedirect: `${process.env.CLIENT_SIDE_URL}/register?error=AuthFailed`,
  } as any),
  RegisterAndLoginUsingLinkedIn,
);

export default userRouter;
