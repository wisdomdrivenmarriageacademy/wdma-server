// src/routes/student-routes/order-routes.ts
import { Router } from "express";
import {
  createOrder,
  verifyPaymentAndFinalizeOrder,
} from "../../controllers/student-controller/order-controller";
import authenticate from "../../middleware/auth-middleware";

const router = Router();

router.post("/create", authenticate, createOrder);
router.post("/verify", authenticate, verifyPaymentAndFinalizeOrder);

export default router;
