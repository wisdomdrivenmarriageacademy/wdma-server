// src/controllers/instructor-controller/course-controller.ts
import { Request, Response } from "express";
import Course, { ICourse } from "../../models/Course";
import { JwtPayload } from "jsonwebtoken";

function currentUser(req: Request): JwtPayload {
  return req.user as JwtPayload;
}

// ----------------------
// Add New Course
// ----------------------
export const addNewCourse = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const user = currentUser(req);
    const courseData = {
      ...(req.body as Partial<ICourse>),
      instructorId: String(user._id),
      instructorName: String(user.userName),
    };
    const newlyCreatedCourse = new Course(courseData);
    const savedCourse = await newlyCreatedCourse.save();

    res.status(201).json({
      success: true,
      message: "Course saved successfully",
      data: savedCourse,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Some error occurred while saving course!",
    });
  }
};

// ----------------------
// Get All Courses
// ----------------------
export const getAllCourses = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const user = currentUser(req);
    const coursesList = await Course.find(
      user.role === "instructor" ? { instructorId: String(user._id) } : {}
    ).sort({ date: -1 });

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
// Get Course Details By ID
// ----------------------
export const getCourseDetailsByID = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const courseDetails = await Course.findById(id);
    const user = currentUser(req);

    if (
      !courseDetails ||
      (user.role === "instructor" &&
        courseDetails.instructorId !== String(user._id))
    ) {
      res.status(404).json({
        success: false,
        message: "Course not found!",
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
      message: "Some error occurred while retrieving course details!",
    });
  }
};

// ----------------------
// Update Course By ID
// ----------------------
export const updateCourseByID = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const user = currentUser(req);
    const updatedCourseData: Partial<ICourse> = {
      ...(req.body as Partial<ICourse>),
    };

    if (user.role === "instructor") {
      updatedCourseData.instructorId = String(user._id);
      updatedCourseData.instructorName = String(user.userName);
    } else {
      delete updatedCourseData.instructorId;
      delete updatedCourseData.instructorName;
    }

    const updatedCourse = await Course.findByIdAndUpdate(
      user.role === "instructor"
        ? { _id: id, instructorId: String(user._id) }
        : id,
      updatedCourseData,
      { new: true }
    );

    if (!updatedCourse) {
      res.status(404).json({
        success: false,
        message: "Course not found!",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Course updated successfully",
      data: updatedCourse,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Some error occurred while updating course!",
    });
  }
};
