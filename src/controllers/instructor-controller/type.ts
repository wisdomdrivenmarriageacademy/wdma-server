import { Document } from "mongoose";

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
  students: Array<{
    studentId: string;
    studentName: string;
    studentEmail: string;
    paidAmount: string;
  }>;
  curriculum: Array<{
    title: string;
    videoUrl: string;
    public_id: string;
    freePreview: boolean;
  }>;
  isPublised: boolean;
}
