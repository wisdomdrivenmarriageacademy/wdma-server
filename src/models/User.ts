// src/models/User.ts
import mongoose, { Schema, Document, Model } from "mongoose";

// ----------------------
// Interface
// ----------------------
export interface IUser extends Document {
  userName: string;
  userEmail: string;
  password: string;
  role: string;
}

// ----------------------
// Schema
// ----------------------
const UserSchema = new Schema<IUser>({
  userName: { type: String, required: true },
  userEmail: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, required: true },
});

// ----------------------
// Model
// ----------------------
const User: Model<IUser> = mongoose.model<IUser>("User", UserSchema);

export default User;
