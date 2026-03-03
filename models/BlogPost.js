import mongoose from "mongoose";

const BlogPostSchema = new mongoose.Schema(
  {
    title: { 
      type: String, 
      required: true, 
      trim: true, 
      index: true,
      minlength: 5,
      maxlength: 200
    },
    slug: { 
      type: String, 
      required: true, 
      unique: true, 
      trim: true, 
      index: true,
      lowercase: true
    },
    excerpt: { 
      type: String, 
      default: "",
      maxlength: 300
    },
    content: { 
      type: String, 
      default: "",
    },
    coverImage: { 
      type: String, 
      default: "" 
    },
    category: { 
      type: String, 
      default: "General", 
      index: true,
      enum: ["General", "Farm Tips", "Products", "News", "Updates", "Guides"]
    },
    tags: { 
      type: [String], 
      default: [],
      lowercase: true
    },
    author: { 
      type: String, 
      default: "Admin",
      trim: true
    },
    status: { 
      type: String, 
      enum: ["Draft", "Published"], 
      default: "Draft", 
      index: true 
    },
    showOnSite: { 
      type: Boolean, 
      default: true, 
      index: true 
    },
    publishedAt: { 
      type: Date, 
      default: null,
      index: true
    },
    views: {
      type: Number,
      default: 0
    },
    isFeatured: {
      type: Boolean,
      default: false,
      index: true
    },
    seoDescription: {
      type: String,
      default: "",
      maxlength: 160
    },
    seoKeywords: {
      type: [String],
      default: []
    }
  },
  { timestamps: true }
);

// Index for common queries
BlogPostSchema.index({ status: 1, publishedAt: -1 });
BlogPostSchema.index({ showOnSite: 1, publishedAt: -1 });
BlogPostSchema.index({ isFeatured: 1, publishedAt: -1 });
BlogPostSchema.index({ category: 1, status: 1 });

// Pre-save hook to auto-publish if scheduled and validate content for published posts
BlogPostSchema.pre("save", function(next) {
  if (this.status === "Published") {
    if (!this.publishedAt) {
      this.publishedAt = new Date();
    }
    if (!this.content || this.content.length < 50) {
      return next(new Error("Published posts must have at least 50 characters of content"));
    }
  }
  next();
});

export default mongoose.models.BlogPost || 
  mongoose.model("BlogPost", BlogPostSchema);
