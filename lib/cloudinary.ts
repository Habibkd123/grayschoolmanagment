import { v2 as cloudinary } from "cloudinary";

// Configure Cloudinary with environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

interface CloudinaryUploadResult {
  secure_url: string;
  public_id: string;
}

/**
 * Uploads a file buffer directly to Cloudinary using upload streams.
 * 
 * @param fileBuffer The Buffer representing the file to upload
 * @param folder Optional destination folder inside Cloudinary
 * @returns A promise resolving to the upload result (secure_url and public_id)
 */
export const uploadToCloudinary = (
  fileBuffer: Buffer,
  folder: string = "school-management"
): Promise<CloudinaryUploadResult> => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: folder,
        resource_type: "auto", // Automatically detect file type (image, pdf, etc.)
      },
      (error, result) => {
        if (error) {
          console.error("Cloudinary upload stream error:", error);
          return reject(error);
        }
        if (!result) {
          return reject(new Error("Cloudinary upload result is undefined"));
        }
        resolve({
          secure_url: result.secure_url,
          public_id: result.public_id,
        });
      }
    );

    uploadStream.end(fileBuffer);
  });
};
