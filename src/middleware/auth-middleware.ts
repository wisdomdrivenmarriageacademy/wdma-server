// src/middleware/auth-middleware.ts
import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";

// ----------------------
// Extend Express Request
// ----------------------
declare global {
  namespace Express {
    interface Request {
      user?: string | JwtPayload;
    }
  }
}

const verifyToken = (token: string, secretKey: string): string | JwtPayload => {
  return jwt.verify(token, secretKey);
};

const authenticate = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization;
  console.log(authHeader, "authHeader");

  if (!authHeader) {
    res.status(401).json({
      success: false,
      message: "User is not authenticated",
    });
    return;
  }

  const token = authHeader.split(" ")[1]!;

  try {
    // Use environment variable for security
    const secretKey = process.env.JWT_SECRET || "default_secret";
    const payload = verifyToken(token, secretKey);

    req.user = payload;
    next();
  } catch (e) {
    res.status(401).json({
      success: false,
      message: "Invalid token",
    });
  }
};

export default authenticate;
