// src/controllers/auth-controller/index.ts
import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User, { IUser } from "../../models/User";
import {
  buildOtpEmailHtml,
  buildPasswordResetEmailHtml,
  sendEmail,
} from "../../helpers/email";
import crypto from "crypto";
import mongoose, { Document, Model, Schema } from "mongoose";

// ----------------------
// Register User
// ----------------------
export const registerUser = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { userName, userEmail, password } = req.body as {
      userName: string;
      userEmail: string;
      password: string;
    };

    if (!userName || !userEmail || !password || password.length < 6) {
      res.status(400).json({
        success: false,
        message:
          "User name, email, and a password of at least 6 characters are required",
      });
      return;
    }

    const existingUser = await User.findOne({
      $or: [{ userEmail }, { userName }],
    });

    if (existingUser) {
      res.status(400).json({
        success: false,
        message: "User name or user email already exists",
      });
      return;
    }

    const hashPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
      userName,
      userEmail,
      role: "user",
      password: hashPassword,
    });

    await newUser.save();

    res.status(201).json({
      success: true,
      message: "User registered successfully!",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Internal server error during registration",
    });
  }
};

// ----------------------
// Login User
// ----------------------
export const loginUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userEmail, password } = req.body as {
      userEmail: string;
      password: string;
    };

    const checkUser = await User.findOne({ userEmail });

    if (!checkUser || !(await bcrypt.compare(password, checkUser.password))) {
      res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
      return;
    }

    const secretKey = process.env.JWT_SECRET;
    if (!secretKey) throw new Error("JWT_SECRET is not configured");
    const accessToken = jwt.sign(
      {
        _id: checkUser._id,
        userName: checkUser.userName,
        userEmail: checkUser.userEmail,
        role: checkUser.role,
      },
      secretKey,
      { expiresIn: "120m" }
    );

    res.status(200).json({
      success: true,
      message: "Logged in successfully",
      data: {
        accessToken,
        user: {
          _id: checkUser._id,
          userName: checkUser.userName,
          userEmail: checkUser.userEmail,
          role: checkUser.role,
        },
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Internal server error during login",
    });
  }
};

interface OtpDocument extends Document {
  userEmail: string;
  code: string;
  expiresAt: Date;
}

const OtpSchema: Schema<OtpDocument> = new mongoose.Schema<OtpDocument>({
  userEmail: { type: String, required: true },
  code: { type: String, required: true },
  expiresAt: { type: Date, required: true },
});

function getModel<T extends Document>(
  name: string,
  schema: Schema<T>
): Model<T> {
  return (mongoose.models[name] as Model<T>) || mongoose.model<T>(name, schema);
}

const OtpModel: Model<OtpDocument> = getModel<OtpDocument>("Otp", OtpSchema);

export const requestOtp = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { userEmail } = req.body as { userEmail: string };
    if (!userEmail) {
      res
        .status(400)
        .json({ success: false, message: "userEmail is required" });
      return;
    }
    if (!(await User.exists({ userEmail }))) {
      res.status(404).json({ success: false, message: "User not found" });
      return;
    }
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await OtpModel.findOneAndUpdate(
      { userEmail },
      { userEmail, code, expiresAt },
      { upsert: true }
    );
    try {
      await sendEmail({
        to: userEmail,
        subject: "Your verification code",
        html: buildOtpEmailHtml(code),
      });
    } catch (error) {
      await OtpModel.deleteOne({ userEmail });
      throw error;
    }
    res.status(200).json({ success: true, message: "OTP sent" });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, message: "Failed to send OTP" });
  }
};

export const verifyOtp = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userEmail, code } = req.body as { userEmail: string; code: string };
    if (!userEmail || !code) {
      res
        .status(400)
        .json({ success: false, message: "Email and code are required" });
      return;
    }
    const record = await OtpModel.findOne({ userEmail });
    if (!record || record.code !== code || record.expiresAt < new Date()) {
      res
        .status(400)
        .json({ success: false, message: "Invalid or expired code" });
      return;
    }
    await OtpModel.deleteOne({ userEmail });
    const token = crypto.randomBytes(24).toString("hex");
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000);
    await ResetModel.findOneAndUpdate(
      { userEmail },
      { userEmail, token, expiresAt },
      { upsert: true }
    );
    res.status(200).json({
      success: true,
      message: "OTP verified",
      data: { token },
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, message: "Failed to verify OTP" });
  }
};

// ----------------------
// Password Reset
// ----------------------
interface PasswordResetDocument extends Document {
  userEmail: string;
  token: string;
  expiresAt: Date;
}

const ResetSchema: Schema<PasswordResetDocument> =
  new mongoose.Schema<PasswordResetDocument>({
    userEmail: { type: String, required: true },
    token: { type: String, required: true },
    expiresAt: { type: Date, required: true },
  });

const ResetModel: Model<PasswordResetDocument> =
  getModel<PasswordResetDocument>("PasswordReset", ResetSchema);

export const requestPasswordReset = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { userEmail } = req.body as { userEmail: string };
    const user = await User.findOne({ userEmail });
    if (!user) {
      res.status(404).json({ success: false, message: "User not found" });
      return;
    }
    const token = crypto.randomBytes(24).toString("hex");
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000);
    await ResetModel.findOneAndUpdate(
      { userEmail },
      { userEmail, token, expiresAt },
      { upsert: true }
    );
    const appUrl = process.env.APP_URL || "http://localhost:3000";
    const link = `${appUrl}/auth/reset-password?token=${token}&email=${encodeURIComponent(userEmail)}`;
    await sendEmail({
      to: userEmail,
      subject: "Reset your password",
      html: buildPasswordResetEmailHtml(link),
    });
    res
      .status(200)
      .json({ success: true, message: "Password reset email sent" });
  } catch (e) {
    console.error(e);
    res
      .status(500)
      .json({ success: false, message: "Failed to request password reset" });
  }
};

export const resetPassword = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { userEmail, token, newPassword } = req.body as {
      userEmail: string;
      token: string;
      newPassword: string;
    };
    if (!userEmail || !token || !newPassword || newPassword.length < 6) {
      res.status(400).json({
        success: false,
        message:
          "Email, reset token, and a password of at least 6 characters are required",
      });
      return;
    }
    const record = await ResetModel.findOne({ userEmail, token });
    if (!record || record.expiresAt < new Date()) {
      res
        .status(400)
        .json({ success: false, message: "Invalid or expired token" });
      return;
    }
    const hashPassword = await bcrypt.hash(newPassword, 10);
    await User.updateOne({ userEmail }, { $set: { password: hashPassword } });
    await ResetModel.deleteOne({ userEmail });
    res.status(200).json({ success: true, message: "Password updated" });
  } catch (e) {
    console.error(e);
    res
      .status(500)
      .json({ success: false, message: "Failed to reset password" });
  }
};
