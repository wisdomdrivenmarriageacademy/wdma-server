// src/routes/auth-routes/index.ts
import { Router, Request, Response } from "express";
import {
  registerUser,
  loginUser,
  requestOtp,
  verifyOtp,
  requestPasswordReset,
  resetPassword,
} from "../../controllers/auth-controller/index";
import authenticateMiddleware from "../../middleware/auth-middleware";

const router = Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/request-otp", requestOtp);
router.post("/verify-otp", verifyOtp);
router.post("/request-password-reset", requestPasswordReset);
router.post("/reset-password", resetPassword);

router.get(
  "/check-auth",
  authenticateMiddleware,
  (req: Request, res: Response) => {
    // If you have a custom `user` property added by the middleware,
    // extend Express Request type in a global.d.ts file for stronger typing.
    const user = (req as any).user;

    res.status(200).json({
      success: true,
      message: "Authenticated user!",
      data: {
        user,
      },
    });
  }
);

export default router;
