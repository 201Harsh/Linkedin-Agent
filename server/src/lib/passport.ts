import passport from "passport";
import { Strategy as LinkedInStrategy } from "passport-linkedin-oauth2";
import dotenv from "dotenv";
import axios from "axios";
import UserModel from "../models/user-model.js";

dotenv.config();

const clientID = process.env.LINKEDIN_CLIENT_ID;
const clientSecret = process.env.LINKEDIN_CLIENT_SECRET;
const SERVER_URL = process.env.SERVER_URL || "http://localhost:8000";

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
      scope: ["openid", "profile", "email", "r_profile_basicinfo"],
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
        // --- 1. Base OpenID Payload ---
        const email = profile.emails?.[0]?.value || profile._json?.email;
        const linkedinId = profile.id || profile._json?.sub;
        let avatar = profile.photos?.[0]?.value || profile._json?.picture;
        const name =
          profile.displayName ||
          profile._json?.name ||
          `${profile._json?.given_name} ${profile._json?.family_name}`;

        if (!email) {
          return done(
            new Error("No email found in LinkedIn profile payload"),
            undefined,
          );
        }

        // --- 2. IdentityMe API Call with Silent Fallback ---
        let profileUrl = "";

        try {
          const { data } = await axios.get(
            "https://api.linkedin.com/rest/identityMe",
            {
              headers: {
                Authorization: `Bearer ${accessToken}`,
                "LinkedIn-Version": "202510",
                "X-Restli-Protocol-Version": "2.0.0",
              },
            },
          );

          if (data && data.basicInfo) {
            if (data.basicInfo.profileUrl) {
              profileUrl = data.basicInfo.profileUrl;
            }
            if (data.basicInfo.profilePicture?.croppedImage?.downloadUrl) {
              avatar = data.basicInfo.profilePicture.croppedImage.downloadUrl;
            }
          }
        } catch (apiError: any) {
          // SILENT FALLBACK: No more console warnings. Generates the URL cleanly in the background.
          profileUrl = `https://www.linkedin.com/in/${name.replace(/\s+/g, "-").toLowerCase()}`;
        }

        // --- 3. Database Synchronization ---
        let user = await UserModel.findOne({ email });

        if (user) {
          let isModified = false;

          if (!user.linkedinId) {
            user.linkedinId = linkedinId;
            isModified = true;
          }
          if (avatar && user.avatar !== avatar) {
            user.avatar = avatar;
            isModified = true;
          }
          if (profileUrl && user.profileUrl !== profileUrl) {
            user.profileUrl = profileUrl;
            isModified = true;
          }

          if (isModified) {
            await user.save();
          }

          return done(null, user);
        }

        // --- 4. Create New User ---
        const newUser = await UserModel.create({
          name,
          email,
          linkedinId,
          avatar,
          profileUrl,
          headline: "AgentX User",
          location: "Not Specified",
          connections: 0,
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
