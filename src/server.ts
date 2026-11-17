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
import adminUserRoutes from "./routes/admin-routes/user-routes";
import adminDashboardRoutes from "./routes/admin-routes/dashboard-routes";

const app = express();
const PORT: number = parseInt(process.env.PORT || "8000", 10);
const MONGO_URI: string = process.env.MONGO_URI || "";
const clientOrigin = new URL(
  process.env.APP_URL || "http://localhost:3001"
).origin;

app.use(
  cors({
    origin: [clientOrigin, "http://localhost:3001"],
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

app.get("/health", (_req, res) => {
  res.json({ success: true, db: mongoose.connection.readyState === 1 });
});

app.use("/auth", authRoutes);
app.use("/media", mediaRoutes);
app.use("/instructor/course", instructorCourseRoutes);
app.use("/student/course", studentViewCourseRoutes);
app.use("/student/order", studentViewOrderRoutes);
app.use("/student/courses-bought", studentCoursesRoutes);
app.use("/student/course-progress", studentCourseProgressRoutes);
app.use("/admin/users", adminUserRoutes);
app.use("/admin", adminDashboardRoutes);


app.use((_req: Request, res: Response) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

// Malformed JSON, oversized uploads, and anything a route forgot to catch.
type RequestError = { type?: string; name?: string; message?: string };

app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  const info: RequestError =
    typeof err === "object" && err !== null ? (err as RequestError) : {};
  const status =
    info.type === "entity.parse.failed" || info.name === "MulterError" ? 400 : 500;
  if (status === 500) console.error(err);
  res.status(status).json({
    success: false,
    message: status === 400 ? info.message || "Bad request" : "Something went wrong",
  });
});

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
