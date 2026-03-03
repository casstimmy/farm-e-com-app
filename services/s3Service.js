import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

/**
 * S3 Image Service
 * Handles image uploads, retrieval, and management on AWS S3
 */

const S3_ACCESS_KEY = process.env.S3_ACCESS_KEY;
const S3_SECRET_ACCESS_KEY = process.env.S3_SECRET_ACCESS_KEY;
const S3_BUCKET = process.env.S3_BUCKET || "farm-fresh-store";
const S3_REGION = process.env.S3_REGION || "us-east-1";
const S3_URL = process.env.S3_URL || `https://${S3_BUCKET}.s3.${S3_REGION}.amazonaws.com`;

if (!S3_ACCESS_KEY || !S3_SECRET_ACCESS_KEY) {
  console.warn("AWS S3 credentials not configured. Image uploads will be disabled.");
}

// Lazy-initialize S3 client
let _s3Client = null;
function getS3Client() {
  if (_s3Client) return _s3Client;
  if (!S3_ACCESS_KEY || !S3_SECRET_ACCESS_KEY) {
    throw new Error("S3 credentials not configured");
  }
  _s3Client = new S3Client({
    region: S3_REGION,
    credentials: {
      accessKeyId: S3_ACCESS_KEY,
      secretAccessKey: S3_SECRET_ACCESS_KEY,
    },
  });
  return _s3Client;
}

/**
 * Generate a unique file name for S3
 */
function generateFileName(prefix, originalName) {
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(2, 8);
  const ext = originalName.split(".").pop();
  return `${prefix}/${timestamp}-${randomStr}.${ext}`;
}

/**
 * Upload image to S3
 * @param {Buffer} fileBuffer - Image file buffer
 * @param {string} fileName - Original file name
 * @param {string} category - Category for organizing uploads (e.g., 'animals', 'products', 'blog')
 * @param {string} mimeType - MIME type of the file
 * @returns {Promise<{url: string, key: string}>}
 */
export async function uploadImageToS3(fileBuffer, fileName, category, mimeType = "image/jpeg") {
  if (!S3_ACCESS_KEY || !S3_SECRET_ACCESS_KEY) {
    throw new Error("S3 credentials not configured");
  }

  const key = generateFileName(category, fileName);

  try {
    const command = new PutObjectCommand({
      Bucket: S3_BUCKET,
      Key: key,
      Body: fileBuffer,
      ContentType: mimeType,
      CacheControl: "max-age=31536000", // 1 year cache for immutable files
      Metadata: {
        "original-name": fileName,
        "upload-date": new Date().toISOString(),
      },
    });

    await getS3Client().send(command);
    const url = `${S3_URL}/${key}`;

    return { url, key, fileName };
  } catch (error) {
    console.error("S3 upload error:", error);
    throw new Error(`Failed to upload image: ${error.message}`);
  }
}

/**
 * Get signed URL for temporary S3 object access
 * @param {string} key - S3 object key
 * @param {number} expiresIn - Expiration time in seconds (default: 1 hour)
 * @returns {Promise<string>}
 */
export async function getSignedS3Url(key, expiresIn = 3600) {
  if (!S3_ACCESS_KEY || !S3_SECRET_ACCESS_KEY) {
    throw new Error("S3 credentials not configured");
  }

  try {
    const command = new GetObjectCommand({
      Bucket: S3_BUCKET,
      Key: key,
    });

    const url = await getSignedUrl(getS3Client(), command, { expiresIn });
    return url;
  } catch (error) {
    console.error("Signed URL generation error:", error);
    throw new Error(`Failed to generate signed URL: ${error.message}`);
  }
}

/**
 * Delete image from S3
 * @param {string} key - S3 object key
 * @returns {Promise<boolean>}
 */
export async function deleteImageFromS3(key) {
  if (!S3_ACCESS_KEY || !S3_SECRET_ACCESS_KEY) {
    throw new Error("S3 credentials not configured");
  }

  try {
    const command = new DeleteObjectCommand({
      Bucket: S3_BUCKET,
      Key: key,
    });

    await getS3Client().send(command);
    return true;
  } catch (error) {
    console.error("S3 delete error:", error);
    throw new Error(`Failed to delete image: ${error.message}`);
  }
}

/**
 * Delete multiple images from S3
 * @param {string[]} keys - Array of S3 object keys
 * @returns {Promise<{successful: string[], failed: string[]}>}
 */
export async function deleteMultipleImagesFromS3(keys) {
  if (!S3_ACCESS_KEY || !S3_SECRET_ACCESS_KEY) {
    throw new Error("S3 credentials not configured");
  }

  const successful = [];
  const failed = [];

  for (const key of keys) {
    try {
      await deleteImageFromS3(key);
      successful.push(key);
    } catch (error) {
      console.error(`Failed to delete ${key}:`, error);
      failed.push(key);
    }
  }

  return { successful, failed };
}

/**
 * Extract S3 key from full URL
 * @param {string} url - Full S3 URL
 * @returns {string|null}
 */
export function extractS3Key(url) {
  if (!url) return null;
  
  try {
    const urlObj = new URL(url);
    let key = urlObj.pathname;
    
    // Remove leading slash
    if (key.startsWith("/")) {
      key = key.substring(1);
    }
    
    // Handle virtual-hosted style URLs
    if (url.includes(`${S3_BUCKET}.s3`)) {
      return key;
    }
    
    // Handle path-style URLs
    if (url.includes(`s3.${S3_REGION}.amazonaws.com/${S3_BUCKET}`)) {
      return key;
    }
    
    return key;
  } catch (error) {
    console.error("Error extracting S3 key:", error);
    return null;
  }
}

/**
 * Validate image file
 * @param {Buffer} buffer - File buffer
 * @param {string} mimeType - MIME type
 * @param {number} maxSize - Max file size in bytes (default: 5MB)
 * @returns {{valid: boolean, error: string|null}}
 */
export function validateImage(buffer, mimeType, maxSize = 5 * 1024 * 1024) {
  const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];

  if (!allowedMimeTypes.includes(mimeType)) {
    return { valid: false, error: "Invalid image format. Allowed: JPEG, PNG, WebP, GIF" };
  }

  if (buffer.length > maxSize) {
    return { valid: false, error: `Image size must be less than ${maxSize / 1024 / 1024}MB` };
  }

  return { valid: true, error: null };
}

export default {
  uploadImageToS3,
  getSignedS3Url,
  deleteImageFromS3,
  deleteMultipleImagesFromS3,
  extractS3Key,
  validateImage,
};
