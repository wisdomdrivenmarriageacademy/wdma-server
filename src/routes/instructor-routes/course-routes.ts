// src/routes/instructor-routes/course-routes.ts
import { Router } from "express";
import {
  addNewCourse,
  getAllCourses,
  getCourseDetailsByID,
  updateCourseByID,
} from "../../controllers/instructor-controller/course-controller";
import authenticate, {
  authorizeRoles,
} from "../../middleware/auth-middleware";

const router = Router();

router.use(authenticate, authorizeRoles("admin", "instructor"));
router.post("/add", addNewCourse);
router.get("/get", getAllCourses);
router.get("/get/details/:id", getCourseDetailsByID);
router.put("/update/:id", updateCourseByID);

export default router;
