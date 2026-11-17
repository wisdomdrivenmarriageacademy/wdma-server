// src/controllers/instructor-controller/course-controller.ts
import { Request, Response } from "express";
import Course from "../../models/Course";
import { isValidObjectId } from "mongoose";
import { JwtPayload } from "jsonwebtoken";

function currentUser(req: Request): JwtPayload {
  return req.user as JwtPayload;
}

// Fields an author may set from the course form. Enrolled students, ownership
// and the creation date are managed by the server; publication is managed by
// admins via /admin/courses/:id/publication once a course exists.
const editableFields = [
  "title",
  "category",
  "level",
  "primaryLanguage",
  "subtitle",
  "description",
  "image",
  "welcomeMessage",
  "pricing",
  "objectives",
  "curriculum",
] as const;

function pickEditable(body: Record<string, unknown>) {
  const data: Record<string, unknown> = {};
  for (const key of editableFields) {
    if (body[key] !== undefined) data[key] = body[key];
  }
  if (data.pricing !== undefined) {
    const pricing = Number(data.pricing);
    if (!Number.isFinite(pricing) || pricing < 0) {
      throw new ValidationError("Pricing must be zero or a positive number");
    }
    data.pricing = pricing;
  }
  if (data.curriculum !== undefined && !Array.isArray(data.curriculum)) {
    throw new ValidationError("Curriculum must be a list of lessons");
  }
  return data;
}

class ValidationError extends Error {}

function sendError(res: Response, error: unknown, fallback: string) {
  if (
    error instanceof ValidationError ||
    (error instanceof Error && error.name === "ValidationError") ||
    (error instanceof Error && error.name === "CastError")
  ) {
    res.status(400).json({ success: false, message: error.message });
    return;
  }
  console.error(error);
  res.status(500).json({ success: false, message: fallback });
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
      ...pickEditable(req.body ?? {}),
      isPublised: req.body?.isPublised !== false,
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
    sendError(res, error, "Some error occurred while saving course!");
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
    const courseDetails = isValidObjectId(id) ? await Course.findById(id) : null;
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
    const updatedCourseData = pickEditable(req.body ?? {});

    const updatedCourse = await Course.findByIdAndUpdate(
      user.role === "instructor"
        ? { _id: id, instructorId: String(user._id) }
        : id,
      updatedCourseData,
      { new: true, runValidators: true }
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
    sendError(res, error, "Some error occurred while updating course!");
  }
};
