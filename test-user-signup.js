// Test script to verify user signup works after fix
// Run this in your browser console after applying the database fix

async function testUserSignup() {
  console.log('🧪 Testing user signup after fix...');
  
  try {
    const supabase = window.supabase;
    
    // Generate a unique test email
    const testEmail = `test-${Date.now()}@example.com`;
    const testPassword = 'TestPassword123!';
    
    console.log(`📧 Testing signup with email: ${testEmail}`);
    
    // Test signup
    const { data, error } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
    });
    
    if (error) {
      console.error('❌ Signup failed:', error);
      console.log('Error details:', {
        message: error.message,
        status: error.status,
        statusText: error.statusText
      });
      return;
    }
    
    if (data.user) {
      console.log('✅ Signup successful!');
      console.log('User created:', {
        id: data.user.id,
        email: data.user.email,
        email_confirmed_at: data.user.email_confirmed_at,
        created_at: data.user.created_at
      });
      
      // Test if we can access the user's data
      console.log('🗄️ Testing user data access...');
      const { data: userTrades, error: tradesError } = await supabase
        .from('trades')
        .select('count', { count: 'exact', head: true });
      
      if (tradesError) {
        console.error('❌ Cannot access user trades:', tradesError);
      } else {
        console.log('✅ User can access their trades data');
        console.log(`User has ${userTrades} trades (should be 0 for new user)`);
      }
      
      // Clean up - delete the test user
      console.log('🧹 Cleaning up test user...');
      const { error: deleteError } = await supabase.auth.admin.deleteUser(data.user.id);
      if (deleteError) {
        console.log('⚠️ Could not delete test user (you may need to delete manually):', deleteError);
      } else {
        console.log('✅ Test user deleted successfully');
      }
      
    } else {
      console.log('⚠️ Signup returned no user data');
    }
    
    console.log('\n🎉 User signup test completed!');
    
  } catch (error) {
    console.error('❌ Test script error:', error);
  }
}

// Run the test
testUserSignup();
