const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const multer = require("multer");

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Set up storage engine for vehicle images
const vehicleStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "vehicles",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
    transformation: [{ width: 1000, height: 800, crop: "limit" }],
  },
});

// Create multer upload instance for vehicle images
const uploadVehicleImage = multer({ storage: vehicleStorage });

// Function to delete image from Cloudinary
const deleteImage = async (publicId) => {
  try {
    if (!publicId) return { success: false, message: "No public ID provided" };

    const result = await cloudinary.uploader.destroy(publicId);
    if (result.result === "ok") {
      return { success: true, message: "Image deleted successfully" };
    } else {
      return { success: false, message: "Failed to delete image" };
    }
  } catch (error) {
    console.error("Error deleting image from Cloudinary:", error);
    return { success: false, message: "Error deleting image", error };
  }
};

// Function to extract public ID from Cloudinary URL
const getPublicIdFromUrl = (url) => {
  if (!url) return null;

  try {
    // Extract the public ID from a URL like:
    // https://res.cloudinary.com/CLOUD_NAME/image/upload/v1234567890/folder/filename.jpg
    const urlParts = url.split("/");
    const filenameWithExtension = urlParts[urlParts.length - 1];
    const publicIdWithFolder = urlParts.slice(-2).join("/");

    // Remove the file extension to get the public ID
    return publicIdWithFolder.split(".")[0];
  } catch (error) {
    console.error("Error extracting public ID from URL:", error);
    return null;
  }
};

module.exports = {
  cloudinary,
  uploadVehicleImage,
  deleteImage,
  getPublicIdFromUrl,
};
