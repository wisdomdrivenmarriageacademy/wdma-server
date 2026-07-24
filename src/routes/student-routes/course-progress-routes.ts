// src/routes/student-routes/course-progress-routes.ts
import { Router } from "express";
import {
  getCurrentCourseProgress,
  markCurrentLectureAsViewed,
  resetCurrentCourseProgress,
} from "../../controllers/student-controller/course-progress-controller";
import authenticate, {
  authorizeRoles,
} from "../../middleware/auth-middleware";

const router = Router();

router.use(authenticate, authorizeRoles("user"));
router.get("/get/:userId/:courseId", getCurrentCourseProgress);
router.post("/mark-lecture-viewed", markCurrentLectureAsViewed);
router.post("/reset-progress", resetCurrentCourseProgress);

export default router;
