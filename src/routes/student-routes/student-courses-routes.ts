// src/routes/student-routes/student-courses-routes.ts
import { Router } from "express";
import { getCoursesByStudentId } from "../../controllers/student-controller/student-courses-controller";

const router = Router();

router.get("/get/:studentId", getCoursesByStudentId);

export default router;
