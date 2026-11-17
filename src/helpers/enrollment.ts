import Course from "../models/Course";
import StudentCourses from "../models/StudentCourses";
import type { IOrder } from "../models/Order";

export async function isEnrolled(userId: string, courseId: string) {
  return Boolean(
    await StudentCourses.exists({ userId, "courses.courseId": courseId })
  );
}

// Grants course access for a paid (or free) order. Safe to call more than once.
export async function enrollFromOrder(order: IOrder) {
  await StudentCourses.updateOne(
    { userId: order.userId, "courses.courseId": { $ne: order.courseId } },
    {
      $push: {
        courses: {
          courseId: order.courseId,
          title: order.courseTitle,
          instructorId: order.instructorId,
          instructorName: order.instructorName,
          dateOfPurchase: order.orderDate,
          courseImage: order.courseImage,
        },
      },
    }
  );
  // An upsert can't be combined with the $ne guard above (it would insert a
  // duplicate document), so create the library separately when missing.
  if (!(await StudentCourses.exists({ userId: order.userId }))) {
    await StudentCourses.create({
      userId: order.userId,
      courses: [
        {
          courseId: order.courseId,
          title: order.courseTitle,
          instructorId: order.instructorId,
          instructorName: order.instructorName,
          dateOfPurchase: order.orderDate,
          courseImage: order.courseImage,
        },
      ],
    });
  }

  await Course.updateOne(
    { _id: order.courseId, "students.studentId": { $ne: order.userId } },
    {
      $push: {
        students: {
          studentId: order.userId,
          studentName: order.userName,
          studentEmail: order.userEmail,
          paidAmount: order.coursePricing,
        },
      },
    }
  );
}
