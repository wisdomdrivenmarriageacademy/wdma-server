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
  profileImage?: string;
  preferences: {
    theme: "system" | "light" | "dark";
    emailNotifications: boolean;
    announcements: boolean;
    roleActivity: boolean;
    secondaryRoleActivity: boolean;
    profileVisible: boolean;
  };
}

// ----------------------
// Schema
// ----------------------
const UserSchema = new Schema<IUser>({
  userName: { type: String, required: true },
  userEmail: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, required: true },
  profileImage: { type: String, default: "" },
  preferences: {
    theme: {
      type: String,
      enum: ["system", "light", "dark"],
      default: "system",
    },
    emailNotifications: { type: Boolean, default: true },
    announcements: { type: Boolean, default: true },
    roleActivity: { type: Boolean, default: true },
    secondaryRoleActivity: { type: Boolean, default: false },
    profileVisible: { type: Boolean, default: true },
  },
});

// ----------------------
// Model
// ----------------------
const User: Model<IUser> = mongoose.model<IUser>("User", UserSchema);

export default User;
