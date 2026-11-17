// src/helpers/cloudinary.ts
import { v2 as cloudinary, UploadApiResponse } from "cloudinary";
import { unlink } from "node:fs/promises";

// ----------------------
// Configuration
// ----------------------
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME as string,
  api_key: process.env.CLOUDINARY_API_KEY as string,
  api_secret: process.env.CLOUDINARY_API_SECRET as string,
});

// ----------------------
// Upload Media
// ----------------------
export const uploadMediaToCloudinary = async (
  filePath: string
): Promise<UploadApiResponse> => {
  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY) {
    await unlink(filePath).catch(() => undefined);
    throw new Error("Media storage (Cloudinary) is not configured");
  }
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      resource_type: "auto",
    });
    return result;
  } catch (error) {
    console.error(error);
    throw new Error("Error uploading to Cloudinary");
  } finally {
    // multer writes to a temp folder; don't let it grow forever.
    await unlink(filePath).catch(() => undefined);
  }
};

// ----------------------
// Delete Media
// ----------------------
export const deleteMediaFromCloudinary = async (
  publicId: string
): Promise<void> => {
  try {
    // destroy() only targets images by default; lesson media are videos.
    for (const resource_type of ["video", "image", "raw"]) {
      const result = await cloudinary.uploader.destroy(publicId, {
        resource_type,
      });
      if (result.result === "ok") return;
    }
  } catch (error) {
    console.error(error);
    throw new Error("Failed to delete asset from Cloudinary");
  }
};
