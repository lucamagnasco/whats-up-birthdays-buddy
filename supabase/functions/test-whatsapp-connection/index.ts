import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get Kapso API key from secrets
    const kapsoApiKey = Deno.env.get('KAPSO_API_KEY');
    if (!kapsoApiKey) {
      throw new Error('KAPSO_API_KEY not found in environment variables');
    }

    // Test 1: Check if we can reach the Kapso API
    console.log('Testing Kapso API connectivity...');
    
    try {
      const testResponse = await fetch('https://app.kapso.ai/api/v1/health', {
        method: 'GET',
        headers: {
          'X-API-Key': kapsoApiKey,
          'Content-Type': 'application/json',
        },
      });
      
      console.log('Kapso health check status:', testResponse.status);
      
      if (testResponse.ok) {
        const healthData = await testResponse.json();
        console.log('Kapso health check response:', healthData);
      }
    } catch (healthError) {
      console.log('Kapso health check failed:', healthError.message);
    }

    // Test 2: Check if templates exist
    const templates = [
      {
        name: 'birthday_alert_arg',
        id: 'e72d608c-efc2-4d13-8b71-6f762ff2e62f',
        parameters: ['Recipient Name', 'Birthday Person', 'Age']
      },
      {
        name: 'welcome_birthday',
        id: '578b0acd-e167-4f27-be4d-10922344dd10',
        parameters: ['Member Name']
      }
    ];

    const templateTests = [];

    for (const template of templates) {
      try {
        console.log(`Testing template: ${template.name} (${template.id})`);
        
        const templateResponse = await fetch(`https://app.kapso.ai/api/v1/whatsapp_templates/${template.id}`, {
          method: 'GET',
          headers: {
            'X-API-Key': kapsoApiKey,
            'Content-Type': 'application/json',
          },
        });

        if (templateResponse.ok) {
          const templateData = await templateResponse.json();
          templateTests.push({
            template: template.name,
            id: template.id,
            status: 'exists',
            data: templateData
          });
          console.log(`Template ${template.name} exists:`, templateData);
        } else {
          templateTests.push({
            template: template.name,
            id: template.id,
            status: 'not_found',
            error: `HTTP ${templateResponse.status}`
          });
          console.log(`Template ${template.name} not found: HTTP ${templateResponse.status}`);
        }
      } catch (templateError) {
        templateTests.push({
          template: template.name,
          id: template.id,
          status: 'error',
          error: templateError.message
        });
        console.log(`Error testing template ${template.name}:`, templateError.message);
      }
    }

    // Test 3: Check database for pending messages
    const { data: pendingMessages, error: pendingError } = await supabase
      .from('birthday_messages')
      .select('*')
      .eq('status', 'pending')
      .limit(5);

    if (pendingError) {
      console.error('Error fetching pending messages:', pendingError);
    }

    // Test 4: Check WhatsApp configuration
    const { data: whatsappConfigs, error: configError } = await supabase
      .from('whatsapp_config')
      .select('*')
      .eq('is_active', true);

    if (configError) {
      console.error('Error fetching WhatsApp configs:', configError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'WhatsApp connection test completed',
        results: {
          kapsoApiKey: kapsoApiKey ? 'configured' : 'missing',
          templateTests,
          pendingMessages: pendingMessages?.length || 0,
          whatsappConfigs: whatsappConfigs?.length || 0,
          environment: {
            supabaseUrl: Deno.env.get('SUPABASE_URL') ? 'configured' : 'missing',
            supabaseServiceKey: Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ? 'configured' : 'missing'
          }
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in WhatsApp connection test:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
}); 