# Quick Start Guide - Farm Fresh Store Updates

## What's New?

This update includes:
1. ✅ **Email Notifications** - Automated order confirmation & tracking emails
2. ✅ **Blog System** - Full blog management with public display
3. ✅ **S3 Image Hosting** - AWS S3 integration for image uploads
4. ✅ **JWT Security** - Enhanced customer authentication
5. ✅ **Animal Fetching Fix** - Fixed issue where not all animals were being fetched

## Installation

### 1. Install Dependencies
```bash
npm install
```

This adds:
- `nodemailer` - Email service
- `@aws-sdk/client-s3` - AWS S3 integration
- `sharp` - Image processing

### 2. Configure Environment Variables

Edit `.env.local` and update:

```env
# Email Configuration (Gmail)
EMAIL_USER="your-email@gmail.com"
EMAIL_PASS="your-16-char-app-password"

# AWS S3 Configuration
S3_ACCESS_KEY="your-aws-access-key"
S3_SECRET_ACCESS_KEY="your-aws-secret-key"
S3_BUCKET="farm-fresh-store"
S3_REGION="us-east-1"
S3_URL="https://farm-fresh-store.s3.us-east-1.amazonaws.com"

# JWT (already configured)
JWT_SECRET="your-jwt-secret"
```

### 3. Verify Email Setup

```javascript
// Test your email configuration
import { verifyEmailConnection } from "@/services/emailService";
await verifyEmailConnection();
```

## Features Overview

### 📧 Email Notifications

Customers receive emails at:
- **Order Confirmation** - When payment is verified
- **Shipment Notice** - When order ships with tracking
- **Delivery Confirmation** - When order is delivered
- **Welcome Email** - When new customer registers

### 📝 Blog System

**Admin Features:**
- Create, edit, delete blog posts
- Set featured posts
- Schedule publication
- SEO metadata
- Category management
- Full text editing

**Customer Features:**
- Browse published posts
- Filter by category
- Search posts
- View counter
- Responsive design

**Admin URL:** `/admin/blog`  
**Public URL:** `/blog`

### 🖼️ Image Management

Upload images via:
- `/api/admin/upload` - Image upload endpoint
- Automatic S3 storage
- URL-based display
- Cached delivery via CloudFront (optional)

### 🔐 Security

- JWT tokens: 30-day expiry
- Proper token type validation
- Rate limiting on all endpoints
- Input validation
- HTTPS recommended

## Common Tasks

### Create a Blog Post

1. Go to `/admin/blog`
2. Click "+ New Post"
3. Fill in title, content, cover image
4. Set category and tags
5. Save as Draft or Publish
6. Post appears at `/blog` when published

### Send Order Confirmation Email

Automatic! When order payment is confirmed, email sends to customer.

To verify:
```javascript
import { sendOrderConfirmationEmail } from "@/services/emailService";
await sendOrderConfirmationEmail(order, customer);
```

### Upload Animal Image

```javascript
import { uploadImageToS3 } from "@/services/s3Service";

const result = await uploadImageToS3(
  fileBuffer,
  "myimage.jpg",
  "animals",  // category
  "image/jpeg"
);

console.log(result.url); // Use this URL in database
```

## Troubleshooting

### Email Not Sending?

1. **Check Gmail App Password**
   - Go to: https://myaccount.google.com/apppasswords
   - Create App Password if 2FA enabled
   - Use 16-character password in `EMAIL_PASS`

2. **Check Email Service**
   ```javascript
   import { verifyEmailConnection } from "@/services/emailService";
   const result = await verifyEmailConnection();
   console.log(result); // true = working
   ```

### Images Not Uploading?

1. **Verify S3 Credentials**
   ```javascript
   import { uploadImageToS3 } from "@/services/s3Service";
   // Check console for specific error
   ```

2. **Check File Size**
   - Max 5MB per image
   - Supported: JPEG, PNG, WebP, GIF

### Blog Posts Not Showing?

1. Check post status = "Published"
2. Check `showOnSite` = true
3. Check `publishedAt` <= current date
4. Clear browser cache

## Database Changes

Two models were updated:

### BlogPost (New)
```javascript
{
  title,
  slug,
  content,
  excerpt,
  coverImage,
  category,
  tags,
  status,
  isFeatured,
  views,
  seoDescription,
  seoKeywords
}
```

### Customer (Updated)
```javascript
// Added:
location         // Location reference
locationName     // "Online" for web customers
notes            // Admin notes
```

## API Endpoints

### Blog Management
- `GET /api/admin/store/blog` - List posts
- `POST /api/admin/store/blog` - Create post
- `GET /api/admin/store/blog/[id]` - Get post
- `PUT /api/admin/store/blog/[id]` - Update post
- `DELETE /api/admin/store/blog/[id]` - Delete post

### Blog Public
- `GET /api/store/blog` - List published posts
- `GET /api/store/blog?slug=my-post` - Get single post

### Upload
- `POST /api/admin/upload` - Upload image to S3

## Performance Optimization

### Caching
- Blog lists: 60s cache
- Single posts: 300s cache
- Animals: 30s cache

### Database Indexes
- Blog: status, featured, category
- Customer: location, email, active status
- Animals: species, status, location

## Next Steps

1. ✅ Install dependencies: `npm install`
2. ✅ Configure `.env.local` with email & S3 credentials
3. ✅ Test email: Import and call `verifyEmailConnection()`
4. ✅ Create first blog post at `/admin/blog`
5. ✅ Test public blog at `/blog`
6. ✅ Create test order and verify confirmation email
7. ✅ Upload test images at `/api/admin/upload`

## File Structure

```
services/
  ├── emailService.js       ← Email sending
  ├── s3Service.js          ← Image uploads
  └── (existing services)

pages/
  ├── admin/blog.js         ← Blog management UI
  ├── blog/index.js         ← Public blog listing
  ├── blog/[slug].js        ← Single blog post
  └── api/
      ├── admin/
      │   ├── blog/
      │   │   ├── index.js
      │   │   └── [id].js
      │   └── upload.js
      └── store/
          └── blog/index.js

models/
  ├── BlogPost.js           ← New blog model
  └── Customer.js           ← Updated with location

utils/
  └── customerAuth.js       ← Enhanced JWT handling
```

## Support

For issues:
1. Check `SYSTEM_DOCUMENTATION.md` for detailed info
2. Review error messages in server logs
3. Verify environment variables are set correctly
4. Test individual services in isolation

---

**Last Updated:** March 3, 2026  
**Version:** 1.0.0
