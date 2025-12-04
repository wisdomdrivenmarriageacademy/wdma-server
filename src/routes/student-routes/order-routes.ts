// src/routes/student-routes/order-routes.ts
import { Router } from "express";
import {
  createOrder,
  capturePaymentAndFinalizeOrder,
} from "../../controllers/student-controller/order-controller";

const router = Router();

router.post("/create", createOrder);
router.post("/capture", capturePaymentAndFinalizeOrder);

export default router;
