// src/models/StudentCourses.ts
import mongoose, { Schema, Document, Model } from "mongoose";

// ----------------------
// Interfaces
// ----------------------
export interface IStudentCourseItem {
  courseId: string;
  title: string;
  instructorId: string;
  instructorName: string;
  dateOfPurchase: Date;
  courseImage: string;
}

export interface IStudentCourses extends Document {
  userId: string;
  courses: IStudentCourseItem[];
}

// ----------------------
// Schema
// ----------------------
const StudentCourseItemSchema = new Schema<IStudentCourseItem>({
  courseId: { type: String, required: true },
  title: { type: String, required: true },
  instructorId: { type: String, required: true },
  instructorName: { type: String, required: true },
  dateOfPurchase: { type: Date, default: Date.now },
  courseImage: { type: String, required: true },
});

const StudentCoursesSchema = new Schema<IStudentCourses>({
  userId: { type: String, required: true },
  courses: { type: [StudentCourseItemSchema], default: [] },
});

// ----------------------
// Model
// ----------------------
const StudentCourses: Model<IStudentCourses> = mongoose.model<IStudentCourses>(
  "StudentCourses",
  StudentCoursesSchema
);

export default StudentCourses;
