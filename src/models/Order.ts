// src/models/Order.ts
import mongoose, { Schema, Document, Model } from "mongoose";

// ----------------------
// Interfaces
// ----------------------
export interface IOrder extends Document {
  userId: string;
  userName: string;
  userEmail: string;
  orderStatus: string;
  paymentMethod: string;
  paymentStatus: string;
  orderDate: Date;
  paymentReference: string;
  instructorId: string;
  instructorName: string;
  courseImage: string;
  courseTitle: string;
  courseId: string;
  coursePricing: string;
}

// ----------------------
// Schema
// ----------------------
const OrderSchema = new Schema<IOrder>({
  userId: { type: String, required: true },
  userName: { type: String, required: true },
  userEmail: { type: String, required: true },
  orderStatus: { type: String, required: true },
  paymentMethod: { type: String, required: true },
  paymentStatus: { type: String, required: true },
  orderDate: { type: Date, default: Date.now },
  paymentReference: {
    type: String,
    required: true,
    unique: true,
    sparse: true,
  },
  instructorId: { type: String, required: true },
  instructorName: { type: String, required: true },
  courseImage: { type: String, required: true },
  courseTitle: { type: String, required: true },
  courseId: { type: String, required: true },
  coursePricing: { type: String, required: true },
});

// ----------------------
// Model
// ----------------------
const Order: Model<IOrder> = mongoose.model<IOrder>("Order", OrderSchema);

export default Order;
