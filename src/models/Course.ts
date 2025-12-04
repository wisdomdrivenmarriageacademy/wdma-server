// src/models/Course.ts
import mongoose, { Schema, Document, Model } from "mongoose";

// ----------------------
// Interfaces
// ----------------------
export interface ILecture {
  title: string;
  videoUrl: string;
  public_id: string;
  freePreview: boolean;
}

export interface IStudent {
  studentId: string;
  studentName: string;
  studentEmail: string;
  paidAmount: string;
}

export interface ICourse extends Document {
  instructorId: string;
  instructorName: string;
  date: Date;
  title: string;
  category: string;
  level: string;
  primaryLanguage: string;
  subtitle: string;
  description: string;
  image: string;
  welcomeMessage: string;
  pricing: number;
  objectives: string;
  students: IStudent[];
  curriculum: ILecture[];
  isPublised: boolean;
}

// ----------------------
// Schemas
// ----------------------
const LectureSchema = new Schema<ILecture>({
  title: { type: String, required: true },
  videoUrl: { type: String, required: true },
  public_id: { type: String, required: true },
  freePreview: { type: Boolean, default: false },
});

const StudentSchema = new Schema<IStudent>({
  studentId: { type: String, required: true },
  studentName: { type: String, required: true },
  studentEmail: { type: String, required: true },
  paidAmount: { type: String, required: true },
});

const CourseSchema = new Schema<ICourse>({
  instructorId: { type: String, required: true },
  instructorName: { type: String, required: true },
  date: { type: Date, default: Date.now },
  title: { type: String, required: true },
  category: { type: String, required: true },
  level: { type: String, required: true },
  primaryLanguage: { type: String, required: true },
  subtitle: { type: String, required: true },
  description: { type: String, required: true },
  image: { type: String, required: true },
  welcomeMessage: { type: String, required: true },
  pricing: { type: Number, required: true },
  objectives: { type: String, required: true },
  students: [StudentSchema],
  curriculum: [LectureSchema],
  isPublised: { type: Boolean, default: false },
});

// ----------------------
// Model
// ----------------------
const Course: Model<ICourse> = mongoose.model<ICourse>("Course", CourseSchema);
export default Course;
