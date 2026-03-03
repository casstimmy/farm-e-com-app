import { withAdminAuth } from "@/utils/adminAuth";
import { withRateLimit } from "@/lib/rateLimit";
import {
  uploadImageToS3,
  validateImage,
} from "@/services/s3Service";

/**
 * Image Upload API
 * POST /api/admin/upload
 */
async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { image, category } = req.body;

    if (!image) {
      return res.status(400).json({ error: "Image is required" });
    }

    if (!category) {
      return res.status(400).json({ error: "Category is required (e.g., 'blog', 'animals')" });
    }

    // Decode base64 image
    const matches = image.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      return res.status(400).json({ error: "Invalid image format" });
    }

    const mimeType = matches[1];
    const buffer = Buffer.from(matches[2], "base64");

    // Validate image
    const validation = validateImage(buffer, mimeType);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }

    // Generate filename from category
    const timestamp = Date.now();
    const fileName = `image_${timestamp}`;

    // Upload to S3
    const result = await uploadImageToS3(buffer, fileName, category, mimeType);

    return res.status(200).json({
      message: "Image uploaded successfully",
      url: result.url,
      key: result.key,
    });
  } catch (error) {
    console.error("Image upload error:", error);
    return res.status(500).json({ error: error.message || "Failed to upload image" });
  }
}

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "10mb",
    },
  },
};

export default withRateLimit(
  {
    keyPrefix: "admin-upload",
    methods: ["POST"],
    windowMs: 60 * 1000,
    max: 50,
  },
  withAdminAuth(handler)
);
