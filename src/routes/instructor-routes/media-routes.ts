// src/routes/instructor-routes/media-routes.ts
import { Router, Request, Response } from "express";
import multer, { FileFilterCallback } from "multer";
import {
  uploadMediaToCloudinary,
  deleteMediaFromCloudinary,
} from "../../helpers/cloudinary";

const router = Router();

// Configure Multer
const upload = multer({ dest: "uploads/" });

// -----------------------
// Single File Upload
// -----------------------
router.post(
  "/upload",
  upload.single("file"),
  async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "No file uploaded",
        });
      }

      const result = await uploadMediaToCloudinary(req.file.path);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (e) {
      console.error(e);
      res.status(500).json({ success: false, message: "Error uploading file" });
    }
  }
);

// -----------------------
// Delete File
// -----------------------
router.delete("/delete/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Asset ID is required",
      });
    }

    await deleteMediaFromCloudinary(id);

    res.status(200).json({
      success: true,
      message: "Asset deleted successfully from Cloudinary",
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, message: "Error deleting file" });
  }
});

// -----------------------
// Bulk Upload (multiple files)
// -----------------------
router.post(
  "/bulk-upload",
  upload.array("files", 10),
  async (req: Request, res: Response) => {
    try {
      const files = req.files as Express.Multer.File[]; // <-- Proper typing

      if (!files || files.length === 0) {
        return res.status(400).json({
          success: false,
          message: "No files uploaded",
        });
      }

      const uploadPromises = files.map((fileItem) =>
        uploadMediaToCloudinary(fileItem.path)
      );

      const results = await Promise.all(uploadPromises);

      res.status(200).json({
        success: true,
        data: results,
      });
    } catch (e) {
      console.error(e);
      res
        .status(500)
        .json({ success: false, message: "Error in bulk uploading files" });
    }
  }
);

export default router;
