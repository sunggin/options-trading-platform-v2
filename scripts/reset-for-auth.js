// Reset database for authentication - ensures blank slate for new users
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Supabase URL or Service Role Key is not set in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function resetDatabase() {
  console.log('🔄 Resetting database for authentication...');
  
  try {
    // Delete all existing trades
    console.log('🗑️  Clearing all trades...');
    const { error: tradesError } = await supabase
      .from('trades')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all rows
    
    if (tradesError) {
      console.error('Error clearing trades:', tradesError);
    } else {
      console.log('✅ All trades cleared');
    }

    // Delete all existing accounts
    console.log('🗑️  Clearing all accounts...');
    const { error: accountsError } = await supabase
      .from('accounts')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all rows
    
    if (accountsError) {
      console.error('Error clearing accounts:', accountsError);
    } else {
      console.log('✅ All accounts cleared');
    }

    console.log('🎉 Database reset complete!');
    console.log('');
    console.log('📋 Next steps:');
    console.log('1. Run the updated schema: supabase-schema.sql');
    console.log('2. Enable authentication in Supabase Dashboard');
    console.log('3. Test with new user accounts');
    console.log('');
    console.log('🔐 Each new user will start with a completely blank slate!');

  } catch (error) {
    console.error('❌ Error resetting database:', error);
  }
}

resetDatabase();
