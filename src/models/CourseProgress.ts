// src/models/Progress.ts
import mongoose, { Schema, Document, Model } from "mongoose";

// ----------------------
// Interfaces
// ----------------------
export interface ILectureProgress {
  lectureId: string;
  viewed: boolean;
  dateViewed?: Date;
}

export interface ICourseProgress extends Document {
  userId: string;
  courseId: string;
  completed: boolean;
  completionDate?: Date | null;
  lecturesProgress: ILectureProgress[];
}

// ----------------------
// Schemas
// ----------------------
const LectureProgressSchema = new Schema<ILectureProgress>({
  lectureId: { type: String, required: true },
  viewed: { type: Boolean, default: false },
  dateViewed: { type: Date },
});

const CourseProgressSchema = new Schema<ICourseProgress>({
  userId: { type: String, required: true },
  courseId: { type: String, required: true },
  completed: { type: Boolean, default: false },
  completionDate: { type: Date },
  lecturesProgress: { type: [LectureProgressSchema], default: [] },
});

// ----------------------
// Model
// ----------------------
const Progress: Model<ICourseProgress> = mongoose.model<ICourseProgress>(
  "Progress",
  CourseProgressSchema
);

export default Progress;
