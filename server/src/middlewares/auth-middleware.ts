import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const AuthMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      res.status(401).json({
        error: "Unauthorized Access. No Token Provided!",
      });
      return;
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET as string);
    req.user = decoded;
    next();
  } catch (error: any) {
    res.status(401).json({
      error: "Unauthorized Access. Invalid or Expired Token!",
    });
    return;
  }
};

export default AuthMiddleware;
