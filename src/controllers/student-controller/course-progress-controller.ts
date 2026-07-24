// src/controllers/student-controller/course-progress-controller.ts
import { Request, Response } from "express";
import CourseProgress, { ICourseProgress } from "../../models/CourseProgress";
import Course, { ICourse } from "../../models/Course";
import StudentCourses, { IStudentCourses } from "../../models/StudentCourses";
import { JwtPayload } from "jsonwebtoken";

// ----------------------
// Mark Current Lecture As Viewed
// ----------------------
export const markCurrentLectureAsViewed = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { courseId, lectureId } = req.body as {
      userId: string;
      courseId: string;
      lectureId: string;
    };
    const userId = String((req.user as JwtPayload)._id);

    let progress = await CourseProgress.findOne({ userId, courseId });
    if (!progress) {
      progress = new CourseProgress({
        userId,
        courseId,
        lecturesProgress: [
          {
            lectureId,
            viewed: true,
            dateViewed: new Date(),
          },
        ],
      });
      await progress.save();
    } else {
      const lectureProgress = progress.lecturesProgress.find(
        (item) => item.lectureId === lectureId
      );

      if (lectureProgress) {
        lectureProgress.viewed = true;
        lectureProgress.dateViewed = new Date();
      } else {
        progress.lecturesProgress.push({
          lectureId,
          viewed: true,
          dateViewed: new Date(),
        });
      }
      await progress.save();
    }

    const course: ICourse | null = await Course.findById(courseId);
    if (!course) {
      res.status(404).json({
        success: false,
        message: "Course not found",
      });
      return;
    }

    // Check if all lectures are viewed
    const allLecturesViewed =
      progress.lecturesProgress.length === course.curriculum.length &&
      progress.lecturesProgress.every((item) => item.viewed);

    if (allLecturesViewed) {
      progress.completed = true;
      progress.completionDate = new Date();
      await progress.save();
    }

    res.status(200).json({
      success: true,
      message: "Lecture marked as viewed",
      data: progress,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Some error occurred while marking lecture as viewed!",
    });
  }
};

// ----------------------
// Get Current Course Progress
// ----------------------
export const getCurrentCourseProgress = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { courseId } = req.params;
    const userId = String((req.user as JwtPayload)._id);

    const studentPurchasedCourses: IStudentCourses | null =
      await StudentCourses.findOne({ userId });

    const isPurchased =
      (studentPurchasedCourses?.courses ?? []).some(
        (item) => item.courseId === courseId
      ) ?? false;

    if (!isPurchased) {
      res.status(200).json({
        success: true,
        data: { isPurchased: false },
        message: "You need to purchase this course to access it.",
      });
      return;
    }

    const currentUserCourseProgress: ICourseProgress | null =
      await CourseProgress.findOne({ userId, courseId });

    if (
      !currentUserCourseProgress ||
      currentUserCourseProgress.lecturesProgress.length === 0
    ) {
      const course: ICourse | null = await Course.findById(courseId);
      if (!course) {
        res.status(404).json({
          success: false,
          message: "Course not found",
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: "No progress found, you can start watching the course",
        data: {
          courseDetails: course,
          progress: [],
          isPurchased: true,
        },
      });
      return;
    }

    const courseDetails: ICourse | null = await Course.findById(courseId);

    res.status(200).json({
      success: true,
      data: {
        courseDetails,
        progress: currentUserCourseProgress.lecturesProgress,
        completed: currentUserCourseProgress.completed,
        completionDate: currentUserCourseProgress.completionDate,
        isPurchased: true,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Some error occurred while fetching course progress!",
    });
  }
};

// ----------------------
// Reset Course Progress
// ----------------------
export const resetCurrentCourseProgress = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { courseId } = req.body as {
      userId: string;
      courseId: string;
    };
    const userId = String((req.user as JwtPayload)._id);

    const progress = await CourseProgress.findOne({ userId, courseId });

    if (!progress) {
      res.status(404).json({
        success: false,
        message: "Progress not found!",
      });
      return;
    }

    progress.lecturesProgress = [];
    progress.completed = false;
    progress.completionDate = null;

    await progress.save();

    res.status(200).json({
      success: true,
      message: "Course progress has been reset",
      data: progress,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Some error occurred while resetting course progress!",
    });
  }
};
