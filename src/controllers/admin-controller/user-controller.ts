import { Request, Response } from "express";
import { JwtPayload } from "jsonwebtoken";
import User from "../../models/User";

const roles = ["user", "instructor", "admin"] as const;

export const getUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const requestedRole =
      typeof req.query.role === "string" ? req.query.role : undefined;

    if (requestedRole && !roles.includes(requestedRole as (typeof roles)[number])) {
      res.status(400).json({ success: false, message: "Invalid role filter" });
      return;
    }

    const users = await User.find(requestedRole ? { role: requestedRole } : {})
      .select("_id userName userEmail role profileImage")
      .sort({ userName: 1 });

    res.status(200).json({ success: true, data: users });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Unable to fetch users" });
  }
};

export const updateUserRole = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { role } = req.body as { role?: string };
    const currentUser = req.user as JwtPayload;

    if (!role || !roles.includes(role as (typeof roles)[number])) {
      res.status(400).json({ success: false, message: "Invalid role" });
      return;
    }

    if (String(currentUser._id) === req.params.id && role !== "admin") {
      res.status(400).json({
        success: false,
        message: "You cannot remove your own administrator access",
      });
      return;
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true, runValidators: true }
    ).select("_id userName userEmail role profileImage");

    if (!user) {
      res.status(404).json({ success: false, message: "User not found" });
      return;
    }

    res.status(200).json({
      success: true,
      message: "User role updated",
      data: user,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Unable to update role" });
  }
};
