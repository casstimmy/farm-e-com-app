# Animals Data Diagnostic Guide

## Current Status
✅ API endpoints properly populate animals with location data  
✅ SSR page correctly filters  
✅ New diagnostic endpoints created  
❓ Database might be empty or animals don't match display criteria

## Display Criteria (Required for Animals to Show)
Animals MUST have ALL of these to appear:
- `status: "Alive"` (not Dead, Sold, or Quarantined)
- `isArchived: false` (not true)
- `projectedSalesPrice > 0` (must have a sales price set)

## Diagnostic Steps

### Step 1: Check Database Health
```bash
# In development, visit:
http://localhost:3001/api/health/animals-check

# Or in production (if env var set):
# Headers: x-api-key: YOUR_DEBUG_API_KEY
```

This will show:
- Total animals in database
- Animals by status (Alive, Dead, Sold, Quarantined)
- Animals with sales pricing
- How many animals are displayable
- Sample of problematic animals

### Step 2: Detailed Diagnostic Analysis
```bash
# Visit:
http://localhost:3001/api/admin/health/animals-debug?action=check

# Shows:
# - Total count
# - By status breakdown  
# - Animals without Alive status
# - Animals without sales price
# - Archived animals
```

### Step 3: View Sample Animals
```bash
# See what animals are in the database:
http://localhost:3001/api/admin/health/animals-debug?action=sample

# Shows first 10 animals with their status and price
```

### Step 4: Create Sample Animals (Development Only)
If database is empty:

```bash
# In development, create 3 demo animals that will display:
http://localhost:3001/api/admin/health/animals-debug?action=fix-samples

# Creates:
# - DEMO-001 (Cattle, ₦250,000)
# - DEMO-002 (Goat, ₦75,000)
# - DEMO-003 (Sheep, ₦45,000)
```

### Step 5: Check Server Logs
After deploying to Vercel, check logs for:
```
[Animals SSR] Filter: {"status":"Alive",...}
[Animals SSR] Found X items (page 1), total matching: Y
[Animals SSR] Database stats - Total: Z, Alive: A, HasSalesPrice: B
```

## Common Issues & Solutions

### Issue: "No animals found" but database isn't empty
**Solution:** Animals exist but don't meet criteria
- Some are not status "Alive" → Update their status
- Some have projectedSalesPrice = 0 → Set a sales price
- Some are archived → Set isArchived to false

### Issue: Complete empty database
**Solution:** Run `/api/admin/health/animals-debug?action=fix-samples` in development

### Issue: Animals show in database but not on page
**Check:**
1. Is location data populated correctly?
   - Animals with `location: null` might cause populate issues
2. Are console logs showing the issue?
   - Check Vercel production logs for the [Animals SSR] debug messages
3. Test the API endpoint directly:
   - `GET http://localhost:3001/api/store/animals`
   - Should return animals array with populated location

## Files Modified

1. **pages/api/store/animals/index.js** - Added comprehensive logging
2. **pages/animals/index.js** - Added debug stats collection
3. **pages/api/health/animals-check.js** - NEW: Health check endpoint
4. **pages/api/admin/health/animals-debug.js** - NEW: Detailed diagnostic endpoint

## Next Steps

1. Start dev server: `npm run dev`
2. Visit `/api/health/animals-check` to assess the situation
3. Take appropriate action based on the results
4. Check `/animals` page to verify animals now display
5. Monitor console logs when deploying to production
