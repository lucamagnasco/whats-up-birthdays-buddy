// Production Birthday System Check
// Run this script to check what's happening with the birthday notifications

const { createClient } = require('@supabase/supabase-js');

// Replace with your actual Supabase production credentials
const SUPABASE_URL = 'https://mxprusqbnjhbqstmrgkt.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'YOUR_SERVICE_ROLE_KEY'; // Get this from your Supabase dashboard

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function checkProductionBirthdaySystem() {
  console.log('🔍 Checking Production Birthday System...\n');
  console.log('Current time:', new Date().toISOString());
  console.log('Expected cron run time: 12:00 UTC (9:00 AM Buenos Aires)\n');

  try {
    // 1. Check current date in database
    console.log('1. Checking database date...');
    const { data: dateData, error: dateError } = await supabase
      .rpc('get_current_date');
    
    if (dateError) {
      console.log('Using alternative date check...');
      const { data: altDateData, error: altDateError } = await supabase
        .from('group_members')
        .select('created_at')
        .limit(1);
      
      if (altDateError) {
        console.error('❌ Error checking database date:', altDateError);
        return;
      }
      console.log('✅ Database is accessible');
    } else {
      console.log('✅ Database date:', dateData);
    }

    // 2. Check for today's birthdays
    console.log('\n2. Checking for today\'s birthdays...');
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    console.log('Looking for birthdays on:', today);
    
    const { data: todayBirthdays, error: birthdayError } = await supabase
      .from('group_members')
      .select(`
        id,
        name,
        birthday,
        whatsapp_number,
        groups!inner(name)
      `)
      .eq('birthday', today);

    if (birthdayError) {
      console.error('❌ Error checking birthdays:', birthdayError);
      return;
    }

    if (todayBirthdays && todayBirthdays.length > 0) {
      console.log(`✅ Found ${todayBirthdays.length} birthday(s) today:`);
      todayBirthdays.forEach(b => {
        console.log(`   - ${b.name} (${b.groups.name}) - WhatsApp: ${b.whatsapp_number || 'NO NUMBER'}`);
      });
    } else {
      console.log('ℹ️  No birthdays found for today');
      
      // Check if there are any birthdays in the next few days
      console.log('\nChecking upcoming birthdays...');
      const { data: upcomingBirthdays, error: upcomingError } = await supabase
        .from('group_members')
        .select(`
          id,
          name,
          birthday,
          groups!inner(name)
        `)
        .gte('birthday', today)
        .lt('birthday', new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
        .order('birthday')
        .limit(5);

      if (!upcomingError && upcomingBirthdays && upcomingBirthdays.length > 0) {
        console.log('Upcoming birthdays:');
        upcomingBirthdays.forEach(b => {
          const birthdayDate = new Date(b.birthday);
          const daysUntil = Math.ceil((birthdayDate - new Date()) / (1000 * 60 * 60 * 24));
          console.log(`   - ${b.name}: ${b.birthday} (in ${daysUntil} days)`);
        });
      }
    }

    // 3. Check for birthday messages today
    console.log('\n3. Checking for birthday messages today...');
    const { data: todayMessages, error: messageError } = await supabase
      .from('birthday_messages')
      .select('*')
      .gte('created_at', today + 'T00:00:00')
      .lt('created_at', today + 'T23:59:59')
      .order('created_at', { ascending: false });

    if (messageError) {
      console.error('❌ Error checking messages:', messageError);
      return;
    }

    if (todayMessages && todayMessages.length > 0) {
      console.log(`✅ Found ${todayMessages.length} birthday message(s) today:`);
      const statusCounts = {};
      todayMessages.forEach(m => {
        statusCounts[m.status] = (statusCounts[m.status] || 0) + 1;
        console.log(`   - ${m.recipient_number}: ${m.status} (${m.template_parameters[0]})`);
      });
      console.log('\nStatus summary:', statusCounts);
    } else {
      console.log('ℹ️  No birthday messages found for today');
    }

    // 4. Check cron job status
    console.log('\n4. Checking cron job status...');
    try {
      const { data: cronJobs, error: cronError } = await supabase
        .rpc('check_cron_jobs');
      
      if (cronError) {
        console.log('⚠️  Cannot check cron jobs directly');
        console.log('   You can check manually in Supabase dashboard or run:');
        console.log('   SELECT * FROM cron.job WHERE command LIKE \'%check_todays_birthdays%\';');
      } else {
        console.log('✅ Cron jobs:', cronJobs);
      }
    } catch (e) {
      console.log('⚠️  Cron check not available');
    }

    // 5. Manual trigger suggestion
    if (todayBirthdays && todayBirthdays.length > 0 && (!todayMessages || todayMessages.length === 0)) {
      console.log('\n🚀 MANUAL TRIGGER NEEDED:');
      console.log('   The birthday function hasn\'t run yet. You can trigger it manually:');
      console.log('   SELECT public.check_todays_birthdays();');
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the check
checkProductionBirthdaySystem(); 