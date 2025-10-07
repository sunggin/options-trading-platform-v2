// Diagnostic script to check user signup issues
// Run this in your browser console on the signup page

async function diagnoseUserSignup() {
  console.log('🔍 Diagnosing user signup issues...');
  
  try {
    // Check if Supabase is properly configured
    if (typeof window.supabase === 'undefined') {
      console.error('❌ Supabase client not found on window object');
      return;
    }
    
    const supabase = window.supabase;
    
    // Test 1: Check Supabase connection
    console.log('📡 Testing Supabase connection...');
    const { data: session, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) {
      console.error('❌ Supabase connection error:', sessionError);
    } else {
      console.log('✅ Supabase connection working');
    }
    
    // Test 2: Check if user is already signed in
    if (session?.user) {
      console.log('⚠️ User already signed in:', session.user.email);
      console.log('User ID:', session.user.id);
    } else {
      console.log('✅ No existing session (good for testing signup)');
    }
    
    // Test 3: Try to fetch current user (this tests auth service)
    console.log('👤 Testing auth service...');
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) {
      console.error('❌ Auth service error:', userError);
    } else if (user) {
      console.log('✅ Auth service working, current user:', user.email);
    } else {
      console.log('✅ Auth service working, no current user');
    }
    
    // Test 4: Check database connection by testing a simple query
    console.log('🗄️ Testing database connection...');
    const { data: tradesData, error: tradesError } = await supabase
      .from('trades')
      .select('count', { count: 'exact', head: true });
    
    if (tradesError) {
      console.error('❌ Database connection error:', tradesError);
      console.log('This might indicate RLS or permission issues');
    } else {
      console.log('✅ Database connection working');
    }
    
    // Test 5: Check if we can access auth.users (should fail due to RLS)
    console.log('🔒 Testing auth.users access...');
    const { data: usersData, error: usersError } = await supabase
      .from('auth.users')
      .select('count', { count: 'exact', head: true });
    
    if (usersError) {
      console.log('✅ auth.users properly protected (expected error):', usersError.message);
    } else {
      console.log('⚠️ auth.users accessible (might be unexpected)');
    }
    
    console.log('\n🎯 Summary:');
    console.log('- If all tests show ✅, the issue might be in the signup process itself');
    console.log('- If you see ❌ errors, those need to be fixed first');
    console.log('- The most common issue is database triggers trying to create profiles in non-existent tables');
    
  } catch (error) {
    console.error('❌ Diagnostic script error:', error);
  }
}

// Run the diagnostic
diagnoseUserSignup();
