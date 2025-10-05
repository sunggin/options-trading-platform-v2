// Manual Password Reset Script
// Run this if you need to reset your password manually

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function manualPasswordReset() {
  console.log('🔧 MANUAL PASSWORD RESET');
  console.log('========================');
  
  try {
    const email = 'sunggin.kang@gmail.com';
    const newPassword = 'your-new-password-here'; // CHANGE THIS
    
    console.log('📧 Resetting password for:', email);
    console.log('⚠️  Make sure to change the password in the script first!');
    
    // Update the user's password directly using admin privileges
    const { data, error } = await supabase.auth.admin.updateUserById(
      'a15821e9-0a29-45f0-8a78-e820ec38972c', // Your user ID
      { password: newPassword }
    );
    
    if (error) {
      console.log('❌ Error:', error.message);
    } else {
      console.log('✅ Password updated successfully!');
      console.log('🔑 New password:', newPassword);
      console.log('📝 You can now sign in with this password');
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

// Uncomment the line below to run the reset
// manualPasswordReset();
