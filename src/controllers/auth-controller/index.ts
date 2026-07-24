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
        profileImage: checkUser.profileImage,
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
          profileImage: checkUser.profileImage,
          preferences: checkUser.preferences,
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

const publicUserFields =
  "_id userName userEmail role profileImage preferences";

export const getSettings = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const user = await User.findById((req.user as jwt.JwtPayload)._id).select(
      publicUserFields
    );
    if (!user) {
      res.status(404).json({ success: false, message: "User not found" });
      return;
    }
    res.status(200).json({ success: true, data: { user } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Unable to load settings" });
  }
};

export const updateSettings = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const user = await User.findById((req.user as jwt.JwtPayload)._id);
    if (!user) {
      res.status(404).json({ success: false, message: "User not found" });
      return;
    }

    const {
      userName,
      userEmail,
      profileImage,
      theme,
      emailNotifications,
      announcements,
      roleActivity,
      secondaryRoleActivity,
      profileVisible,
      currentPassword,
      newPassword,
    } = req.body as Record<string, unknown>;

    if (typeof userName === "string") {
      const value = userName.trim();
      if (value.length < 2 || value.length > 80) {
        res.status(400).json({
          success: false,
          message: "Name must be between 2 and 80 characters",
        });
        return;
      }
      user.userName = value;
    }

    if (typeof userEmail === "string") {
      const value = userEmail.trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        res.status(400).json({
          success: false,
          message: "Enter a valid email address",
        });
        return;
      }
      user.userEmail = value;
    }

    if (typeof profileImage === "string") {
      const value = profileImage.trim();
      if (value.length > 2048) {
        res.status(400).json({
          success: false,
          message: "Profile image URL is too long",
        });
        return;
      }
      if (value) {
        try {
          const url = new URL(value);
          if (!["http:", "https:"].includes(url.protocol)) throw new Error();
        } catch {
          res.status(400).json({
            success: false,
            message: "Profile image must be a valid web address",
          });
          return;
        }
      }
      user.profileImage = value;
    }

    if (
      typeof theme === "string" &&
      !["system", "light", "dark"].includes(theme)
    ) {
      res.status(400).json({ success: false, message: "Invalid theme" });
      return;
    }
    if (typeof theme === "string") {
      user.preferences.theme = theme as "system" | "light" | "dark";
    }

    const booleanPreferences = {
      emailNotifications,
      announcements,
      roleActivity,
      secondaryRoleActivity,
      profileVisible,
    };
    for (const [key, value] of Object.entries(booleanPreferences)) {
      if (typeof value === "boolean") {
        Object.assign(user.preferences, { [key]: value });
      }
    }

    if (currentPassword !== undefined || newPassword !== undefined) {
      if (
        typeof currentPassword !== "string" ||
        typeof newPassword !== "string" ||
        newPassword.length < 6
      ) {
        res.status(400).json({
          success: false,
          message:
            "Current password and a new password of at least 6 characters are required",
        });
        return;
      }
      if (!(await bcrypt.compare(currentPassword, user.password))) {
        res.status(400).json({
          success: false,
          message: "Current password is incorrect",
        });
        return;
      }
      user.password = await bcrypt.hash(newPassword, 10);
    }

    await user.save();
    const updatedUser = await User.findById(user._id).select(publicUserFields);
    res.status(200).json({
      success: true,
      message: "Settings saved",
      data: { user: updatedUser },
    });
  } catch (error: unknown) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === 11000
    ) {
      res.status(409).json({
        success: false,
        message: "That name or email is already in use",
      });
      return;
    }
    console.error(error);
    res.status(500).json({ success: false, message: "Unable to save settings" });
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
