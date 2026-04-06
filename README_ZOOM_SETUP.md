# Zoom Integration Setup Guide

## Issue: Meeting links not working

If you're experiencing issues where clicking "Join Meeting" doesn't work, follow these steps:

## 1. Apply Database Migration

The Zoom fields need to be added to your database first:

```bash
# Start Supabase (if not already running)
supabase start

# Apply the migration
supabase db push

# Or apply the migration manually
supabase migration up
```

## 2. Check Database Schema

Verify the Zoom fields exist in the `study_sessions` table:

```sql
-- Check if Zoom columns exist
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'study_sessions' 
AND column_name LIKE 'zoom_%';
```

## 3. Test with Existing Sessions

For existing sessions that don't have Zoom data, you can:

1. **Edit the session** to add a manual meeting link
2. **Create a new session** with Zoom integration enabled
3. **Update existing sessions** in the database:

```sql
-- Example: Update an existing session with Zoom data
UPDATE study_sessions 
SET 
    zoom_meeting_id = '123456789',
    zoom_join_url = 'https://zoom.us/j/123456789',
    zoom_password = 'abc123'
WHERE id = 'your-session-id';
```

## 4. Environment Variables

Make sure your Zoom API credentials are set in `.env`:

```env
VITE_ZOOM_ACCOUNT_ID=your_zoom_account_id
VITE_ZOOM_CLIENT_ID=your_zoom_client_id
VITE_ZOOM_CLIENT_SECRET=your_zoom_client_secret
```

## 5. Debug Mode

The Session page now includes debug info in development mode. Look for the yellow debug box to see:
- Whether the session is marked as online
- What meeting links are available
- Zoom field values

## 6. Manual Testing

If you want to test without Zoom API setup:

1. Create an online session
2. Toggle OFF "Auto-create Zoom Meeting"  
3. Add a manual meeting link (like https://meet.google.com/test)
4. Test the join button

## 7. Common Issues

### "Nothing happens when I click join"
- Check browser console for errors
- Verify the meeting link is valid
- Check if popup blockers are preventing new tabs

### "Zoom fields are missing"
- Run the database migration
- Restart your Supabase instance
- Check the database schema

### "Debug info shows None for all fields"
- The session might not have meeting data
- Try creating a new session with meeting info
- Check if the session is marked as "online"

## 8. Quick Fix for Testing

If you need to test immediately, add this to your browser console on the session page:

```javascript
// Test with a mock Zoom meeting
window.open('https://zoom.us/test', '_blank');
```

This will verify that the join functionality works, just with a test link instead of real session data.
