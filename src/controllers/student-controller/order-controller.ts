// src/controllers/payment/paypal-order-controller.ts
import { Request, Response } from "express";
import paypal from "../../helpers/paypal";
import Order, { IOrder } from "../../models/Order";
import Course from "../../models/Course";
import StudentCourses from "../../models/StudentCourses";

interface CreateOrderBody {
  userId: string;
  userName: string;
  userEmail: string;
  orderStatus: string;
  paymentMethod: string;
  paymentStatus: string;
  orderDate: string;
  paymentId?: string;
  payerId?: string;
  instructorId: string;
  instructorName: string;
  courseImage: string;
  courseTitle: string;
  courseId: string;
  coursePricing: number;
}

interface CapturePaymentBody {
  paymentId: string;
  payerId: string;
  orderId: string;
}

/**
 * Create PayPal payment and initialize order
 */
export const createOrder = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const {
      userId,
      userName,
      userEmail,
      orderStatus,
      paymentMethod,
      paymentStatus,
      orderDate,
      paymentId,
      payerId,
      instructorId,
      instructorName,
      courseImage,
      courseTitle,
      courseId,
      coursePricing,
    } = req.body as CreateOrderBody;

    const createPaymentJson = {
      intent: "sale",
      payer: { payment_method: "paypal" },
      redirect_urls: {
        return_url: `${process.env.CLIENT_URL}/payment-return`,
        cancel_url: `${process.env.CLIENT_URL}/payment-cancel`,
      },
      transactions: [
        {
          item_list: {
            items: [
              {
                name: courseTitle,
                sku: courseId,
                price: coursePricing.toFixed(2),
                currency: "USD",
                quantity: 1,
              },
            ],
          },
          amount: {
            currency: "USD",
            total: coursePricing.toFixed(2),
          },
          description: courseTitle,
        },
      ],
    };

    paypal.payment.create(
      createPaymentJson,
      async (error: any, paymentInfo: any) => {
        if (error) {
          console.error(error);
          res.status(500).json({
            success: false,
            message: "Error while creating PayPal payment!",
          });
          return;
        }

        const newOrder = new Order({
          userId,
          userName,
          userEmail,
          orderStatus,
          paymentMethod,
          paymentStatus,
          orderDate,
          paymentId,
          payerId,
          instructorId,
          instructorName,
          courseImage,
          courseTitle,
          courseId,
          coursePricing,
        });

        await newOrder.save();

        const approvalLink = paymentInfo.links.find(
          (link: any) => link.rel === "approval_url"
        )?.href;

        if (!approvalLink) {
          res.status(500).json({
            success: false,
            message: "Approval URL not returned by PayPal.",
          });
          return;
        }

        res.status(201).json({
          success: true,
          data: {
            approveUrl: approvalLink,
            orderId: newOrder._id,
          },
        });
      }
    );
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "An error occurred while creating the order!",
    });
  }
};

/**
 * Capture PayPal payment and finalize order
 */
export const capturePaymentAndFinalizeOrder = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { paymentId, payerId, orderId } = req.body as CapturePaymentBody;

    const order = await Order.findById(orderId);
    if (!order) {
      res.status(404).json({
        success: false,
        message: "Order not found!",
      });
      return;
    }

    order.paymentStatus = "paid";
    order.orderStatus = "confirmed";
    order.paymentId = paymentId;
    order.payerId = payerId;
    await order.save();

    // Update StudentCourses collection
    const studentCourses = await StudentCourses.findOne({
      userId: order.userId,
    });

    const purchasedCourse = {
      courseId: order.courseId,
      title: order.courseTitle,
      instructorId: order.instructorId,
      instructorName: order.instructorName,
      dateOfPurchase: order.orderDate,
      courseImage: order.courseImage,
    };

    if (studentCourses) {
      studentCourses.courses.push(purchasedCourse);
      await studentCourses.save();
    } else {
      const newStudentCourses = new StudentCourses({
        userId: order.userId,
        courses: [purchasedCourse],
      });
      await newStudentCourses.save();
    }

    // Add student to Course
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
      message: "Order confirmed and payment captured",
      data: order,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "An error occurred while capturing payment!",
    });
  }
};
