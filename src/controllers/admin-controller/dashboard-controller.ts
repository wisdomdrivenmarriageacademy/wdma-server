import { Request, Response } from "express";
import Course from "../../models/Course";
import CourseProgress from "../../models/CourseProgress";
import Order from "../../models/Order";
import User from "../../models/User";

const allowedRanges = new Set([30, 90, 365]);

function startOfDay(date: Date) {
  const result = new Date(date);
  result.setUTCHours(0, 0, 0, 0);
  return result;
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export const getDashboardAnalytics = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const requestedDays = Number(req.query.days);
    const days = allowedRanges.has(requestedDays) ? requestedDays : 90;
    const end = new Date();
    const start = startOfDay(
      new Date(end.getTime() - (days - 1) * 24 * 60 * 60 * 1000)
    );

    const [
      usersByRole,
      courseSummary,
      orderSummary,
      trend,
      topCourses,
      recentOrders,
      progressSummary,
      activeLearners,
    ] = await Promise.all([
      User.aggregate([
        { $group: { _id: "$role", count: { $sum: 1 } } },
      ]),
      Course.aggregate([
        {
          $group: {
            _id: null,
            courses: { $sum: 1 },
            publishedCourses: {
              $sum: { $cond: ["$isPublised", 1, 0] },
            },
            lessons: { $sum: { $size: { $ifNull: ["$curriculum", []] } } },
          },
        },
      ]),
      Order.aggregate([
        {
          $group: {
            _id: null,
            revenue: {
              $sum: {
                $cond: [
                  { $eq: ["$paymentStatus", "paid"] },
                  {
                    $convert: {
                      input: "$coursePricing",
                      to: "double",
                      onError: 0,
                      onNull: 0,
                    },
                  },
                  0,
                ],
              },
            },
            paidOrders: {
              $sum: { $cond: [{ $eq: ["$paymentStatus", "paid"] }, 1, 0] },
            },
            pendingOrders: {
              $sum: { $cond: [{ $ne: ["$paymentStatus", "paid"] }, 1, 0] },
            },
          },
        },
      ]),
      Order.aggregate([
        { $match: { paymentStatus: "paid", orderDate: { $gte: start } } },
        {
          $group: {
            _id: {
              $dateToString: { format: "%Y-%m-%d", date: "$orderDate" },
            },
            revenue: {
              $sum: {
                $convert: {
                  input: "$coursePricing",
                  to: "double",
                  onError: 0,
                  onNull: 0,
                },
              },
            },
            enrollments: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      Order.aggregate([
        { $match: { paymentStatus: "paid", orderDate: { $gte: start } } },
        {
          $group: {
            _id: "$courseId",
            title: { $first: "$courseTitle" },
            revenue: {
              $sum: {
                $convert: {
                  input: "$coursePricing",
                  to: "double",
                  onError: 0,
                  onNull: 0,
                },
              },
            },
            enrollments: { $sum: 1 },
          },
        },
        { $sort: { revenue: -1 } },
        { $limit: 5 },
      ]),
      Order.find()
        .select(
          "_id userName userEmail courseTitle coursePricing paymentStatus paymentMethod paymentReference orderDate"
        )
        .sort({ orderDate: -1 })
        .limit(8)
        .lean(),
      CourseProgress.aggregate([
        {
          $group: {
            _id: null,
            trackedCourses: { $sum: 1 },
            completedCourses: {
              $sum: { $cond: ["$completed", 1, 0] },
            },
          },
        },
      ]),
      CourseProgress.distinct("userId"),
    ]);

    const roles = Object.fromEntries(
      usersByRole.map((item) => [item._id, item.count])
    );
    const courses = courseSummary[0] ?? {
      courses: 0,
      publishedCourses: 0,
      lessons: 0,
    };
    const orders = orderSummary[0] ?? {
      revenue: 0,
      paidOrders: 0,
      pendingOrders: 0,
    };
    const progress = progressSummary[0] ?? {
      trackedCourses: 0,
      completedCourses: 0,
    };

    res.status(200).json({
      success: true,
      data: {
        period: { days, from: start, to: end },
        totals: {
          users:
            Number(roles.user || 0) +
            Number(roles.instructor || 0) +
            Number(roles.admin || 0),
          students: Number(roles.user || 0),
          instructors: Number(roles.instructor || 0),
          administrators: Number(roles.admin || 0),
          courses: courses.courses,
          publishedCourses: courses.publishedCourses,
          draftCourses: courses.courses - courses.publishedCourses,
          lessons: courses.lessons,
          revenue: orders.revenue,
          paidOrders: orders.paidOrders,
          pendingOrders: orders.pendingOrders,
          activeLearners: activeLearners.length,
          completedCourses: progress.completedCourses,
          completionRate: progress.trackedCourses
            ? Math.round(
                (progress.completedCourses / progress.trackedCourses) * 100
              )
            : 0,
        },
        trend: trend.map((item) => ({
          date: item._id,
          revenue: item.revenue,
          enrollments: item.enrollments,
        })),
        topCourses: topCourses.map((item) => ({
          courseId: item._id,
          title: item.title,
          revenue: item.revenue,
          enrollments: item.enrollments,
        })),
        recentOrders,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Unable to load admin analytics",
    });
  }
};

export const getOrders = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);
    const status =
      typeof req.query.status === "string" ? req.query.status : "all";
    const search =
      typeof req.query.search === "string" ? req.query.search.trim() : "";
    const filter: Record<string, unknown> = {};

    if (status !== "all") filter.paymentStatus = status;
    if (search) {
      const pattern = new RegExp(escapeRegex(search), "i");
      filter.$or = [
        { userName: pattern },
        { userEmail: pattern },
        { courseTitle: pattern },
        { paymentReference: pattern },
      ];
    }

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .select("-__v")
        .sort({ orderDate: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Order.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      data: {
        orders,
        pagination: {
          page,
          limit,
          total,
          pages: Math.max(Math.ceil(total / limit), 1),
        },
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Unable to load transactions",
    });
  }
};

export const updateCoursePublication = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { published } = req.body as { published?: boolean };
    if (typeof published !== "boolean") {
      res.status(400).json({
        success: false,
        message: "Published must be true or false",
      });
      return;
    }

    const course = await Course.findByIdAndUpdate(
      req.params.id,
      { isPublised: published },
      { new: true, runValidators: true }
    );

    if (!course) {
      res.status(404).json({ success: false, message: "Course not found" });
      return;
    }

    res.status(200).json({
      success: true,
      message: published ? "Course published" : "Course moved to draft",
      data: course,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Unable to update course publication",
    });
  }
};
