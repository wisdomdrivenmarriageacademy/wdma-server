// src/routes/auth-routes/index.ts
import { Router, Request, Response } from "express";
import {
  registerUser,
  loginUser,
  requestOtp,
  verifyOtp,
  requestPasswordReset,
  resetPassword,
  getSettings,
  updateSettings,
} from "../../controllers/auth-controller/index";
import authenticateMiddleware from "../../middleware/auth-middleware";
import User from "../../models/User";
import { JwtPayload } from "jsonwebtoken";

const router = Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/request-otp", requestOtp);
router.post("/verify-otp", verifyOtp);
router.post("/request-password-reset", requestPasswordReset);
router.post("/reset-password", resetPassword);
router.get("/settings", authenticateMiddleware, getSettings);
router.patch("/settings", authenticateMiddleware, updateSettings);

router.get(
  "/check-auth",
  authenticateMiddleware,
  async (req: Request, res: Response) => {
    try {
      const payload = req.user as JwtPayload;
      const user = await User.findById(payload._id).select(
        "_id userName userEmail role profileImage preferences"
      );

      if (!user) {
        res.status(401).json({ success: false, message: "User not found" });
        return;
      }

      res.status(200).json({
        success: true,
        message: "Authenticated user!",
        data: { user },
      });
    } catch {
      res.status(500).json({
        success: false,
        message: "Unable to load the authenticated user",
      });
    }
  }
);

export default router;
