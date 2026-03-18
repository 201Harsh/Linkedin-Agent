import cors from "cors";
import express from "express";
import cookieParser from "cookie-parser";
import session from "express-session";
import passport from "passport";
import "./lib/passport.js"; 
import UserRouter from "./router/user-route.js";
import aiRouter from "./router/ai-router.js";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(
  cors({
    origin: process.env.CLIENT_SIDE_URL || "http://localhost:3000",
    credentials: true,
  }),
);

app.use(
  session({
    secret: process.env.SESSION_SECRET || "super_secret_agentx_key_12345",
    resave: false,
    saveUninitialized: true, 
    cookie: { secure: false },
  }),
);

app.use(passport.initialize());
app.use(passport.session());

app.use("/users", UserRouter);
app.use("/ai", aiRouter);

export default app;
