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

  if (!authHeader) {
    res.status(401).json({
      success: false,
      message: "User is not authenticated",
    });
    return;
  }

  const token = authHeader.split(" ")[1]!;

  try {
    const secretKey = process.env.JWT_SECRET;
    if (!secretKey) {
      res.status(500).json({
        success: false,
        message: "JWT_SECRET is not configured",
      });
      return;
    }
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

export const authorizeRoles =
  (...roles: string[]) =>
  (req: Request, res: Response, next: NextFunction): void => {
    const role =
      typeof req.user === "object" && req.user
        ? (req.user as JwtPayload).role
        : undefined;

    if (!role || !roles.includes(role)) {
      res.status(403).json({
        success: false,
        message: "You do not have permission to perform this action",
      });
      return;
    }

    next();
  };
