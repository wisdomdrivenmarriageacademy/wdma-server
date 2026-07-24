// src/routes/student-routes/course-routes.ts
import { Router } from "express";
import {
  getStudentViewCourseDetails,
  getAllStudentViewCourses,
  checkCoursePurchaseInfo,
} from "../../controllers/student-controller/course-controller";
import authenticate, {
  authorizeRoles,
} from "../../middleware/auth-middleware";

const router = Router();

router.get("/get", getAllStudentViewCourses);
router.get("/get/details/:id", getStudentViewCourseDetails);
router.get(
  "/purchase-info/:id/:studentId",
  authenticate,
  authorizeRoles("user"),
  checkCoursePurchaseInfo
);

export default router;
