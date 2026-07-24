import { Router } from "express";
import {
  getDashboardAnalytics,
  getOrders,
  updateCoursePublication,
} from "../../controllers/admin-controller/dashboard-controller";
import authenticate, {
  authorizeRoles,
} from "../../middleware/auth-middleware";

const router = Router();

router.use(authenticate, authorizeRoles("admin"));
router.get("/dashboard", getDashboardAnalytics);
router.get("/orders", getOrders);
router.patch("/courses/:id/publication", updateCoursePublication);

export default router;
