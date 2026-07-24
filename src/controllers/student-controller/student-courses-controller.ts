// src/controllers/student/student-courses-controller.ts
import { Request, Response } from "express";
import StudentCourses, { IStudentCourses } from "../../models/StudentCourses";
import { JwtPayload } from "jsonwebtoken";

export const getCoursesByStudentId = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const studentId = String((req.user as JwtPayload)._id);

    const studentBoughtCourses = await StudentCourses.findOne({
      userId: studentId,
    });

    res.status(200).json({
      success: true,
      data: studentBoughtCourses?.courses ?? [],
    });
  } catch (error) {
    console.error("Error fetching student courses:", error);
    res.status(500).json({
      success: false,
      message: "Some error occurred while retrieving courses!",
    });
  }
};
