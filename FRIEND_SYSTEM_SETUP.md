# Friend System Setup Guide

## Step 1: Run the Database Migration

1. **Go to your Supabase Dashboard**
   - Visit: https://supabase.com/dashboard
   - Select your project

2. **Open the SQL Editor**
   - Click on "SQL Editor" in the left sidebar
   - Click "New Query"

3. **Copy and Paste the SQL**
   - Open the file: `create-friendships-table.sql`
   - Copy ALL the content
   - Paste it into the SQL Editor

4. **Run the Query**
   - Click the "Run" button (or press Ctrl+Enter / Cmd+Enter)
   - You should see "Success. No rows returned"

5. **Verify the Table**
   - Click "Table Editor" in the left sidebar
   - You should see a new table called "friendships"

## Step 2: Deploy Your Updated Code

The code changes are automatic - just push to your repository and Vercel will deploy!

## What You Get

### For Users:
- **Find Traders**: Browse all platform users
- **Send Friend Requests**: Click to send requests
- **Manage Requests**: Accept or reject incoming requests
- **Friend List**: See all your friends
- **Private Feed**: Only see trades from friends

### Features:
- ✅ Real-time friend requests
- ✅ Accept/Reject functionality
- ✅ Mutual friendships
- ✅ Privacy protection
- ✅ User search (coming soon - for now shows all users)
- ✅ Friend count display

## Troubleshooting

If you get an error when running the SQL:
1. Make sure you copied ALL the content from the file
2. Try running it in sections (create table, then policies, then functions)
3. Check if the table already exists (it's okay to run again, it uses "IF NOT EXISTS")

If users can't see friends:
1. Make sure the SQL ran successfully
2. Check that RLS (Row Level Security) is enabled
3. Verify users are logged in

## Need Help?

If you run into issues:
1. Check the browser console for errors (F12 → Console tab)
2. Check the Supabase logs (Dashboard → Logs)
3. Make sure you're logged in to test the features

