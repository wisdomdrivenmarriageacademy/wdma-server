// src/routes/student-routes/student-courses-routes.ts
import { Router } from "express";
import { getCoursesByStudentId } from "../../controllers/student-controller/student-courses-controller";
import authenticate, {
  authorizeRoles,
} from "../../middleware/auth-middleware";

const router = Router();

router.get(
  "/get/:studentId",
  authenticate,
  authorizeRoles("user"),
  getCoursesByStudentId
);

export default router;
