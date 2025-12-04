// src/controllers/instructor-controller/course-controller.ts
import { Request, Response } from "express";
import Course, { ICourse } from "../../models/Course";

// ----------------------
// Add New Course
// ----------------------
export const addNewCourse = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const courseData = req.body as Partial<ICourse>;
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
  _req: Request,
  res: Response
): Promise<void> => {
  try {
    const coursesList = await Course.find({});

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

    if (!courseDetails) {
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
    const updatedCourseData = req.body as Partial<ICourse>;

    const updatedCourse = await Course.findByIdAndUpdate(
      id,
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
