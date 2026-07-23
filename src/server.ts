// src/index.ts
import "dotenv/config";
import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import mongoose from "mongoose";
import authRoutes from "./routes/auth-routes/index";
import mediaRoutes from "./routes/instructor-routes/media-routes";
import instructorCourseRoutes from "./routes/instructor-routes/course-routes";
import studentViewCourseRoutes from "./routes/student-routes/course-routes";
import studentViewOrderRoutes from "./routes/student-routes/order-routes";
import studentCoursesRoutes from "./routes/student-routes/student-courses-routes";
import studentCourseProgressRoutes from "./routes/student-routes/course-progress-routes";
import bodyParser from "body-parser"

const app = express();
const PORT: number = parseInt(process.env.PORT || "8000", 10);
const MONGO_URI: string = process.env.MONGO_URI || "";
const clientOrigin = new URL(
  process.env.APP_URL || "http://localhost:3000"
).origin;

app.use(
  cors({
    origin: [clientOrigin, "http://localhost:3000"],
    credentials: true,
    methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE"],
    allowedHeaders: [
      "Origin",
      "X-Requested-With",
      "Content-Type",
      "Accept",
      "Authorization",
    ],
  })
);

app.use(express.json());
app.use(bodyParser.json());

// Database connection
// Routes configuration
app.use("/auth", authRoutes);
app.use("/media", mediaRoutes);
app.use("/instructor/course", instructorCourseRoutes);
app.use("/student/course", studentViewCourseRoutes);
app.use("/student/order", studentViewOrderRoutes);
app.use("/student/courses-bought", studentCoursesRoutes);
app.use("/student/course-progress", studentCourseProgressRoutes);


// Error handler middleware
// app.use(
//   (
//     err: Error,
//     req: Request,
//     res: Response,
//     next: NextFunction // eslint-disable-line @typescript-eslint/no-unused-vars
//   ) => {
//     console.error(err.stack);
//     res.status(500).json({
//       success: false,
//       message: "Something went wrong",
//     });
//   }
// );

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log("MongoDB is connected");
    app.listen(PORT, () => {
      console.log(`Server is now running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("MongoDB connection error:", error);
    process.exitCode = 1;
  });
