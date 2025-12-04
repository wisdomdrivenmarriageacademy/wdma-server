// src/controllers/student-controller/course-controller.ts
import { Request, Response } from "express";
import Course, { ICourse } from "../../models/Course";
import StudentCourses, { IStudentCourses } from "../../models/StudentCourses";

// ----------------------
// Get All Student View Courses
// ----------------------
export const getAllStudentViewCourses = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const {
      category = "",
      level = "",
      primaryLanguage = "",
      sortBy = "price-lowtohigh",
    } = req.query as {
      category?: string;
      level?: string;
      primaryLanguage?: string;
      sortBy?: string;
    };

    console.log(req.query, "req.query");

    const filters: Record<string, any> = {};
    if (category) {
      filters.category = { $in: category.split(",") };
    }
    if (level) {
      filters.level = { $in: level.split(",") };
    }
    if (primaryLanguage) {
      filters.primaryLanguage = { $in: primaryLanguage.split(",") };
    }

    const sortParam: Record<string, 1 | -1> = {};
    switch (sortBy) {
      case "price-lowtohigh":
        sortParam.pricing = 1;
        break;
      case "price-hightolow":
        sortParam.pricing = -1;
        break;
      case "title-atoz":
        sortParam.title = 1;
        break;
      case "title-ztoa":
        sortParam.title = -1;
        break;
      default:
        sortParam.pricing = 1;
        break;
    }

    const coursesList: ICourse[] = await Course.find(filters).sort(sortParam);

    res.status(200).json({
      success: true,
      data: coursesList,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Some error occurred while fetching courses!",
    });
  }
};

// ----------------------
// Get Student View Course Details
// ----------------------
export const getStudentViewCourseDetails = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const courseDetails = await Course.findById(id);

    if (!courseDetails) {
      res.status(404).json({
        success: false,
        message: "No course details found",
        data: null,
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: courseDetails,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Some error occurred while fetching course details!",
    });
  }
};

// ----------------------
// Check Course Purchase Info
// ----------------------
export const checkCoursePurchaseInfo = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id, studentId } = req.params;

    const studentCourses: IStudentCourses | null = await StudentCourses.findOne(
      {
        userId: studentId,
      }
    );

    const alreadyPurchased =
      studentCourses?.courses.some((item) => item.courseId === id) ?? false;

    res.status(200).json({
      success: true,
      data: alreadyPurchased,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Some error occurred while checking purchase info!",
    });
  }
};
