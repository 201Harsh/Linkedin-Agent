import passport from "passport";
import { Strategy as LinkedInStrategy } from "passport-linkedin-oauth2";
import dotenv from "dotenv";
import UserModel from "../models/user-model.js";

dotenv.config();

const clientID = process.env.LINKEDIN_CLIENT_ID;
const clientSecret = process.env.LINKEDIN_CLIENT_SECRET;

const SERVER_URL = process.env.SERVER_URL || "http://localhost:5000";

if (!clientID || !clientSecret) {
  throw new Error(
    "LinkedIn OAuth credentials are missing in environment variables",
  );
}

passport.serializeUser((user: any, done) => {
  done(null, user._id);
});

passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await UserModel.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

passport.use(
  new LinkedInStrategy(
    {
      clientID,
      clientSecret,
      callbackURL: `${SERVER_URL}/users/linkedin/callback`,
      scope: ["openid", "profile", "email"],
      proxy: true,
      state: true,
    } as any,
    async (
      accessToken: string,
      refreshToken: string,
      profile: any,
      done: (error: any, user?: any) => void,
    ) => {
      try {
        const email = profile.emails?.[0]?.value || profile._json?.email;
        const linkedinId = profile.id || profile._json?.sub;
        const avatar = profile.photos?.[0]?.value || profile._json?.picture;
        const name =
          profile.displayName ||
          profile._json?.name ||
          `${profile._json?.given_name} ${profile._json?.family_name}`;

        if (!email) {
          console.error("Failed Payload:", profile);
          return done(
            new Error("No email found in LinkedIn profile payload"),
            undefined,
          );
        }

        let user = await UserModel.findOne({ email });

        if (user) {
          let isModified = false;

          if (!user.linkedinId) {
            user.linkedinId = linkedinId;
            isModified = true;
          }
          if (!user.avatar && avatar) {
            user.avatar = avatar;
            isModified = true;
          }

          if (isModified) {
            await user.save();
          }

          return done(null, user);
        }

        const newUser = await UserModel.create({
          name,
          email,
          linkedinId,
          avatar,
        });

        return done(null, newUser);
      } catch (error) {
        return done(
          error instanceof Error ? error : new Error("LinkedIn Auth Failed"),
          undefined,
        );
      }
    },
  ),
);

export default passport;
