// Birthday System Check Script
// This script helps diagnose and fix birthday notification issues

const { createClient } = require('@supabase/supabase-js');

// You'll need to replace these with your actual Supabase credentials
const SUPABASE_URL = 'YOUR_SUPABASE_URL';
const SUPABASE_SERVICE_ROLE_KEY = 'YOUR_SERVICE_ROLE_KEY';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function checkBirthdaySystem() {
  console.log('🔍 Checking Birthday Notification System...\n');

  try {
    // 1. Check for today's birthdays
    console.log('1. Checking for today\'s birthdays...');
    const { data: todayBirthdays, error: birthdayError } = await supabase
      .from('group_members')
      .select(`
        id,
        name,
        birthday,
        groups!inner(name)
      `)
      .eq('birthday', new Date().toISOString().split('T')[0]);

    if (birthdayError) {
      console.error('❌ Error checking birthdays:', birthdayError);
      return;
    }

    if (todayBirthdays && todayBirthdays.length > 0) {
      console.log(`✅ Found ${todayBirthdays.length} birthday(s) today:`);
      todayBirthdays.forEach(b => {
        console.log(`   - ${b.name} (${b.groups.name})`);
      });
    } else {
      console.log('ℹ️  No birthdays found for today');
    }

    // 2. Check for pending birthday messages
    console.log('\n2. Checking for pending birthday messages...');
    const { data: pendingMessages, error: messageError } = await supabase
      .from('birthday_messages')
      .select('*')
      .eq('status', 'pending')
      .gte('created_at', new Date().toISOString().split('T')[0]);

    if (messageError) {
      console.error('❌ Error checking messages:', messageError);
      return;
    }

    if (pendingMessages && pendingMessages.length > 0) {
      console.log(`✅ Found ${pendingMessages.length} pending birthday message(s):`);
      pendingMessages.forEach(m => {
        console.log(`   - To: ${m.recipient_number} (${m.template_parameters[0]})`);
      });
    } else {
      console.log('ℹ️  No pending birthday messages found');
    }

    // 3. Check for failed messages
    console.log('\n3. Checking for failed birthday messages...');
    const { data: failedMessages, error: failedError } = await supabase
      .from('birthday_messages')
      .select('*')
      .eq('status', 'failed')
      .gte('created_at', new Date().toISOString().split('T')[0]);

    if (failedError) {
      console.error('❌ Error checking failed messages:', failedError);
      return;
    }

    if (failedMessages && failedMessages.length > 0) {
      console.log(`⚠️  Found ${failedMessages.length} failed birthday message(s):`);
      failedMessages.forEach(m => {
        console.log(`   - To: ${m.recipient_number} - Error: ${m.error_message}`);
      });
    } else {
      console.log('✅ No failed birthday messages found');
    }

    // 4. Manual trigger option
    if (todayBirthdays && todayBirthdays.length > 0 && (!pendingMessages || pendingMessages.length === 0)) {
      console.log('\n🚀 Manual Trigger Available:');
      console.log('   Run this SQL in your database to manually trigger birthday notifications:');
      console.log('   SELECT public.check_todays_birthdays();');
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the check
checkBirthdaySystem(); 