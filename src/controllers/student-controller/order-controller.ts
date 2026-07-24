import { randomUUID } from "node:crypto";
import { Request, Response } from "express";
import { JwtPayload } from "jsonwebtoken";
import {
  initializePaystackTransaction,
  toSubunit,
  verifyPaystackTransaction,
} from "../../helpers/paystack";
import Order from "../../models/Order";
import Course from "../../models/Course";
import StudentCourses from "../../models/StudentCourses";

type AuthenticatedUser = JwtPayload & {
  _id: string;
  userName: string;
  userEmail: string;
};

export const createOrder = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { courseId } = req.body as { courseId?: string };
    const user = req.user as AuthenticatedUser | undefined;
    const course = courseId ? await Course.findById(courseId) : null;

    if (!user?._id || !user.userEmail) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }
    if (!course) {
      res.status(404).json({ success: false, message: "Course not found" });
      return;
    }

    const currency = process.env.PAYSTACK_CURRENCY || "NGN";
    const paymentReference = `wdma-${randomUUID()}`;
    const order = await Order.create({
      userId: user._id,
      userName: user.userName,
      userEmail: user.userEmail,
      orderStatus: "pending",
      paymentMethod: "paystack",
      paymentStatus: "initiated",
      orderDate: new Date(),
      paymentReference,
      instructorId: course.instructorId,
      instructorName: course.instructorName,
      courseImage: course.image,
      courseTitle: course.title,
      courseId: course.id,
      coursePricing: course.pricing,
    });

    try {
      const transaction = await initializePaystackTransaction({
        email: user.userEmail,
        amount: toSubunit(course.pricing),
        reference: paymentReference,
        callbackUrl: `${process.env.CLIENT_URL}/student/payment-return`,
        currency,
      });

      res.status(201).json({
        success: true,
        data: {
          authorizationUrl: transaction.authorization_url,
        },
      });
    } catch (error) {
      await order.deleteOne();
      throw error;
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "An error occurred while initializing payment",
    });
  }
};

export const verifyPaymentAndFinalizeOrder = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { reference } = req.body as {
      reference?: string;
    };
    const user = req.user as AuthenticatedUser | undefined;
    const order = reference
      ? await Order.findOne({ paymentReference: reference })
      : null;

    if (!user?._id) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }
    if (!order || order.userId !== user._id) {
      res.status(404).json({ success: false, message: "Order not found" });
      return;
    }
    const transaction = await verifyPaystackTransaction(reference!);
    const expectedAmount = toSubunit(Number(order.coursePricing));
    const expectedCurrency = process.env.PAYSTACK_CURRENCY || "NGN";

    if (
      transaction.status !== "success" ||
      transaction.reference !== order.paymentReference ||
      transaction.amount !== expectedAmount ||
      transaction.currency !== expectedCurrency
    ) {
      res.status(400).json({
        success: false,
        message: "Payment verification failed",
      });
      return;
    }

    order.paymentStatus = "paid";
    order.orderStatus = "confirmed";
    await order.save();

    const purchasedCourse = {
      courseId: order.courseId,
      title: order.courseTitle,
      instructorId: order.instructorId,
      instructorName: order.instructorName,
      dateOfPurchase: order.orderDate,
      courseImage: order.courseImage,
    };
    const studentCourses = await StudentCourses.findOne({
      userId: order.userId,
    });

    if (studentCourses) {
      if (
        !studentCourses.courses.some(
          (course) => course.courseId === order.courseId
        )
      ) {
        studentCourses.courses.push(purchasedCourse);
        await studentCourses.save();
      }
    } else {
      await StudentCourses.create({
        userId: order.userId,
        courses: [purchasedCourse],
      });
    }

    await Course.findByIdAndUpdate(order.courseId, {
      $addToSet: {
        students: {
          studentId: order.userId,
          studentName: order.userName,
          studentEmail: order.userEmail,
          paidAmount: order.coursePricing,
        },
      },
    });

    res.status(200).json({
      success: true,
      message: "Payment verified and order confirmed",
      data: order,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "An error occurred while verifying payment",
    });
  }
};
