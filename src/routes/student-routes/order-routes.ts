// src/routes/student-routes/order-routes.ts
import { Router } from "express";
import {
  createOrder,
  verifyPaymentAndFinalizeOrder,
} from "../../controllers/student-controller/order-controller";
import authenticate, {
  authorizeRoles,
} from "../../middleware/auth-middleware";

const router = Router();

router.use(authenticate, authorizeRoles("user"));
router.post("/create", createOrder);
router.post("/verify", verifyPaymentAndFinalizeOrder);

export default router;
