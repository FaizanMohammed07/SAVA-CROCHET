const { cloudinary } = require("../config/cloudinary");
const logger = require("../utils/logger");

class ImageService {
  /**
   * Upload single image to Cloudinary
   */
  async uploadImage(filePath, folder = "sava-crochets/products", options = {}) {
    try {
      const result = await cloudinary.uploader.upload(filePath, {
        folder,
        quality: "auto",
        fetch_format: "auto",
        ...options,
      });
      return {
        public_id: result.public_id,
        url: result.secure_url,
      };
    } catch (error) {
      logger.error(`Image upload error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Delete image from Cloudinary
   */
  async deleteImage(publicId) {
    try {
      const result = await cloudinary.uploader.destroy(publicId);
      logger.info(`Image deleted: ${publicId}`);
      return result;
    } catch (error) {
      logger.error(`Image delete error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Delete multiple images
   */
  async deleteMultipleImages(publicIds) {
    try {
      const promises = publicIds.map((id) => cloudinary.uploader.destroy(id));
      await Promise.all(promises);
      logger.info(`Deleted ${publicIds.length} images`);
    } catch (error) {
      logger.error(`Bulk image delete error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get optimized image URL with transformations
   */
  getOptimizedUrl(publicId, options = {}) {
    const { width = 800, height = 800, crop = "limit" } = options;
    return cloudinary.url(publicId, {
      width,
      height,
      crop,
      quality: "auto",
      fetch_format: "auto",
      secure: true,
    });
  }
}

module.exports = new ImageService();
