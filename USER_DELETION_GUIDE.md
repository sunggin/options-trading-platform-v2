# User Deletion Fix Guide

## 🚨 **Problem:**
Getting error: `"Failed to delete user: Database error deleting user"`

## 🔍 **Root Cause:**
Foreign key constraints are preventing user deletion. Even though the constraints have `ON DELETE CASCADE`, there might be:
1. **Missing CASCADE constraints** on some tables
2. **Circular references** between tables
3. **RLS policies** blocking the deletion
4. **Order of deletion** issues

## ✅ **Solution:**

### **Step 1: Run the Database Fix**
Run the `fix-user-deletion.sql` script in your Supabase SQL editor:

```sql
-- This will:
-- 1. Check all foreign key constraints
-- 2. Fix any missing CASCADE DELETE constraints
-- 3. Create safe user deletion functions
-- 4. Provide debugging tools
```

### **Step 2: Use the Safe Deletion Function**
Instead of deleting users directly, use the new function:

```sql
-- To delete a user safely:
SELECT delete_user_safely('user-id-here'::UUID);

-- To check what's blocking deletion:
SELECT * FROM check_user_deletion_blockers('user-id-here'::UUID);
```

### **Step 3: Manual Deletion (if needed)**
If the function doesn't work, delete in this order:

```sql
-- 1. Delete trades first
DELETE FROM trades WHERE user_id = 'user-id-here';

-- 2. Delete accounts (if exists)
DELETE FROM accounts WHERE user_id = 'user-id-here';

-- 3. Delete profile
DELETE FROM profiles WHERE id = 'user-id-here';

-- 4. Finally delete user
DELETE FROM auth.users WHERE id = 'user-id-here';
```

## 🛠️ **What the Fix Does:**

### **1. Constraint Fixes:**
- ✅ **Ensures all foreign keys have CASCADE DELETE**
- ✅ **Fixes profiles table constraint**
- ✅ **Fixes trades table constraint**
- ✅ **Fixes accounts table constraint**

### **2. Safe Deletion Function:**
- ✅ **Deletes in correct order** to avoid constraint issues
- ✅ **Handles errors gracefully** with detailed logging
- ✅ **Checks if user exists** before attempting deletion
- ✅ **Provides feedback** on each step

### **3. Debugging Tools:**
- ✅ **Lists all foreign key constraints** referencing users
- ✅ **Shows what data is blocking deletion**
- ✅ **Provides sample data** for troubleshooting

## 🧪 **Testing:**

### **Test the Fix:**
1. **Run the SQL script** in Supabase
2. **Check constraints** are properly set
3. **Try deleting a test user** using the safe function
4. **Verify all related data** is deleted

### **Debug Issues:**
```sql
-- Check what's preventing deletion:
SELECT * FROM check_user_deletion_blockers('user-id-here'::UUID);

-- Check all foreign key constraints:
-- (The script will show this automatically)
```

## 🎯 **Expected Results:**

### **After Running the Fix:**
- ✅ **User deletion works** without errors
- ✅ **All related data** is automatically deleted
- ✅ **No orphaned records** left behind
- ✅ **Proper error messages** if something goes wrong

### **Safe Deletion Process:**
1. **Trades deleted** first
2. **Accounts deleted** second
3. **Profile deleted** third
4. **User deleted** last
5. **Success confirmation** returned

## 🚀 **Usage:**

### **For Single User Deletion:**
```sql
SELECT delete_user_safely('user-id-here'::UUID);
```

### **For Bulk User Deletion:**
```sql
-- Delete multiple users
SELECT delete_user_safely('user1-id'::UUID);
SELECT delete_user_safely('user2-id'::UUID);
-- etc.
```

### **For Debugging:**
```sql
-- Check what's blocking a specific user
SELECT * FROM check_user_deletion_blockers('user-id-here'::UUID);
```

## 🎉 **Result:**
**User deletion should now work properly with automatic cleanup of all related data!**

**No more "Database error deleting user" messages!** 🚀
