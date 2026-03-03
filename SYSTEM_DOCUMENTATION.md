# Farm Fresh Store - Email & Blog System Documentation

## System Overview

This document outlines the new email notification system, blog management platform, and S3 image handling implemented in the Farm Fresh Store platform.

## 1. Email Service (Nodemailer)

### Configuration

The email service uses Gmail via SMTP. Configure the following in `.env.local`:

```env
EMAIL_USER="your-email@gmail.com"
EMAIL_PASS="your-app-password"  # Use Gmail App Password, not regular password
```

**Gmail Setup Instructions:**
1. Enable 2-Factor Authentication on your Gmail account
2. Generate an App Password: https://myaccount.google.com/apppasswords
3. Use this 16-character password as `EMAIL_PASS`

### Email Service File: `services/emailService.js`

**Functions:**

- `sendOrderConfirmationEmail(order, customer)` - Sends confirmation when order is placed
- `sendShipmentNotificationEmail(order, customer, trackingInfo)` - Notifies when order ships
- `sendDeliveryConfirmationEmail(order, customer)` - Confirms delivery
- `sendWelcomeEmail(customer)` - Welcome message for new customers
- `verifyEmailConnection()` - Test email configuration

### Example Usage

```javascript
import { sendOrderConfirmationEmail } from "@/services/emailService";

// Send order confirmation
await sendOrderConfirmationEmail(order, customer);
```

## 2. Blog Post System

### Blog Post Model

**File:** `models/BlogPost.js`

**Schema Fields:**
- `title` - Post title (required, 5-200 chars)
- `slug` - URL-friendly identifier (auto-generated from title)
- `excerpt` - Summary for listings (max 300 chars)
- `content` - Full post content (min 50 chars)
- `coverImage` - URL to cover image
- `category` - Post category (General, Farm Tips, Products, News, Updates, Guides)
- `tags` - Array of tags for organization
- `author` - Author name (default: "Admin")
- `status` - Draft or Published
- `showOnSite` - Toggle post visibility
- `publishedAt` - Publication date
- `views` - View counter
- `isFeatured` - Featured post flag
- `seoDescription` - Meta description
- `seoKeywords` - SEO keywords

### Blog Admin API

**Endpoint:** `/api/admin/store/blog`

**GET** - List blog posts
```
GET /api/admin/store/blog?status=all&sort=latest&page=1&limit=10
```

**POST** - Create blog post
```json
{
  "title": "Post Title",
  "excerpt": "Brief summary",
  "content": "Full content...",
  "coverImage": "https://url.jpg",
  "category": "Farm Tips",
  "tags": "agriculture, farming",
  "status": "Draft",
  "isFeatured": false,
  "seoDescription": "SEO description",
  "seoKeywords": "keywords, here"
}
```

**Endpoint:** `/api/admin/store/blog/[id]`

**GET** - Get single post  
**PUT** - Update post  
**DELETE** - Delete post

### Blog Public API

**Endpoint:** `/api/store/blog`

**GET** - List published posts
```
GET /api/store/blog?category=Farm%20Tips&page=1&limit=10
GET /api/store/blog?slug=my-post-title  # Get single post
```

Response includes:
- `posts` - Array of blog posts
- `categories` - Category list with counts
- `pagination` - Pagination info
- Post has `views` counter that increments

### Admin Blog Management Page

**File:** `pages/admin/blog.js`

Features:
- Create, edit, delete blog posts
- Filter by status (Draft, Published)
- Sort options (Latest, Oldest, Alphabetical, Featured)
- Cover image preview
- SEO metadata editor
- Bulk status management

### Public Blog Pages

**Files:**
- `pages/blog/index.js` - Main blog listing
- `pages/blog/[slug].js` - Single post view

Features:
- Category filtering
- Search functionality
- Featured posts
- Related posts
- View counter
- Responsive design
- Social sharing

## 3. S3 Image Handling

### Configuration

Configure AWS S3 in `.env.local`:

```env
S3_ACCESS_KEY="your-aws-access-key"
S3_SECRET_ACCESS_KEY="your-aws-secret-key"
S3_BUCKET="farm-fresh-store"
S3_REGION="us-east-1"
S3_URL="https://farm-fresh-store.s3.us-east-1.amazonaws.com"
```

### S3 Service File: `services/s3Service.js`

**Functions:**

```javascript
// Upload image to S3
uploadImageToS3(fileBuffer, fileName, category, mimeType)

// Get signed URL for temporary access
getSignedS3Url(key, expiresIn = 3600)

// Delete image from S3
deleteImageFromS3(key)

// Delete multiple images
deleteMultipleImagesFromS3([keys])

// Extract S3 key from full URL
extractS3Key(url)

// Validate image file
validateImage(buffer, mimeType, maxSize)
```

### Image Upload API

**Endpoint:** `/api/admin/upload`

**POST** - Upload image
```json
{
  "image": "data:image/jpeg;base64,/9j/4AAQSkZJ...",
  "category": "blog"  // or "animals", "products"
}
```

**Response:**
```json
{
  "url": "https://farm-fresh-store.s3.us-east-1.amazonaws.com/blog/1234567-abc123.jpg",
  "key": "blog/1234567-abc123.jpg"
}
```

### Supported Image Formats
- JPEG
- PNG
- WebP
- GIF

**Max Size:** 5MB per file

## 4. Order Notification Flow

When an order is completed:

1. **Order Created** → Sent to `/api/store/checkout`
2. **Payment Verified** → `confirmOrderPayment()` called
3. **Order Confirmation Email** → Sent automatically
4. **Inventory Deducted** → Via farm-health-app API
5. **Customer Stats Updated** → Order count & total spent

### Order Status Email Flow

```
Pending → Paid: Order Confirmation Email
Paid → Shipped: Shipment Notification Email + Tracking
Processing → Shifted → Delivered: Delivery Confirmation Email
```

## 5. Customer Model Updates

**Added Fields:**
- `location` - Location reference (ObjectId)
- `locationName` - Display name (default: "Online")
- `notes` - Customer notes field

**New Indexes:**
```javascript
CustomerSchema.index({ location: 1 });
CustomerSchema.index({ isActive: 1, createdAt: -1 });
CustomerSchema.index({ firstName: 1, lastName: 1 });
```

## 6. JWT Security Implementation

### Customer Auth: `utils/customerAuth.js`

**Enhanced Features:**
- Token expiry: 30 days
- Proper error handling
- Token type validation
- Middleware for optional auth

**Functions:**
```javascript
generateCustomerToken(customer)           // Generate 30-day token
verifyCustomerToken(token)               // Verify token validity
withCustomerAuth(handler)                // Require authentication
withOptionalCustomerAuth(handler)        // Allow optional auth
```

## 7. Animals Fetching Fix

**Issue Fixed:** Animals list API not returning all animals due to filter merge issue

**Solution:** Fixed `projectedSalesPrice` filter handling in `/api/store/animals/index.js`

```javascript
// Before (broken)
filter.projectedSalesPrice = { ...filter.projectedSalesPrice };

// After (fixed)
filter.projectedSalesPrice = filter.projectedSalesPrice || { $gt: 0 };
```

## 8. Package Dependencies Added

Updated in `package.json`:
- `nodemailer: ^6.9.7` - Email sending
- `@aws-sdk/client-s3: ^3.500.0` - AWS S3 client
- `sharp: ^0.33.0` - Image processing

## 9. Database Indices Added

**BlogPost Model:**
```javascript
BlogPostSchema.index({ status: 1, publishedAt: -1 });
BlogPostSchema.index({ showOnSite: 1, publishedAt: -1 });
BlogPostSchema.index({ isFeatured: 1, publishedAt: -1 });
BlogPostSchema.index({ category: 1, status: 1 });
```

**Customer Model:**
```javascript
CustomerSchema.index({ location: 1 });
CustomerSchema.index({ isActive: 1, createdAt: -1 });
CustomerSchema.index({ firstName: 1, lastName: 1 });
```

## 10. Complete Setup Checklist

- [ ] Update `.env.local` with EMAIL credentials
- [ ] Update `.env.local` with S3 credentials
- [ ] Run `npm install` to add new dependencies
- [ ] Test email service with `verifyEmailConnection()`
- [ ] Create first blog post via admin panel
- [ ] Test blog display on public site
- [ ] Test image upload functionality
- [ ] Create test order and verify confirmation email
- [ ] Monitor email logs for delivery status

## 11. Error Handling

All services include comprehensive error handling:

```javascript
try {
  await sendOrderConfirmationEmail(order, customer);
} catch (emailError) {
  console.error("Email failed:", emailError);
  // Service continues - email failure doesn't block order
}
```

## 12. Caching Strategy

**Blog Lists:** 60s public cache, 5min revalidate  
**Single Posts:** 300s cache, 10min revalidate  
**Animals:** 30s cache, 2min revalidate

## 13. Rate Limiting

Applied to all endpoints:
- Admin Blog: 100 requests/minute
- Store Blog: 300 requests/minute
- Image Upload: 50 requests/minute
- Payment Verify: 100 requests/minute

## 14. Testing

### Test Email Service
```javascript
import { verifyEmailConnection } from "@/services/emailService";
await verifyEmailConnection();
```

### Test Blog API
```bash
curl "http://localhost:3001/api/store/blog?category=General"
curl "http://localhost:3001/api/store/blog?slug=my-post"
```

### Test Image Upload
```javascript
const formData = new FormData();
formData.append('image', base64ImageData);
formData.append('category', 'blog');
fetch('/api/admin/upload', { method: 'POST', body: formData });
```

## 15. Production Considerations

1. **Email:** Use transactional email service (SendGrid, AWS SES) instead of Gmail for production
2. **S3:** Implement CloudFront CDN for faster image delivery
3. **Monitoring:** Set up email delivery and S3 access logging
4. **Backups:** Regular database backups for blog posts
5. **Security:** Rotate S3 credentials regularly
6. **SSL/TLS:** Ensure HTTPS for all external API calls

## 16. Support & Troubleshooting

### Email Not Sending
- Verify `EMAIL_USER` and `EMAIL_PASS` in `.env.local`
- Check Gmail 2FA is enabled
- Verify App Password is correct (not regular password)
- Check server logs for error messages

### Images Not Uploading
- Verify S3 credentials are correct
- Check S3 bucket exists and region matches
- Ensure file size < 5MB
- Verify supported format (JPEG, PNG, WebP, GIF)

### Blog Posts Not Appearing
- Check post status is "Published"
- Verify `showOnSite` is true
- Check `publishedAt` date is current or past
- Clear browser cache

---

**System Last Updated:** March 3, 2026  
**Version:** 1.0.0
