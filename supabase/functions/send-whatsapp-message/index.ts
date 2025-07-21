import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WhatsAppTemplate {
  phone_number: string;
  template_name: string;
  language: string;
  template_parameters: string[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { messageId, template, templateId }: { 
      messageId?: string; 
      template?: WhatsAppTemplate; 
      templateId?: string; 
    } = await req.json();

    // Get Kapso API key from secrets
    const kapsoApiKey = Deno.env.get('KAPSO_API_KEY');
    if (!kapsoApiKey) {
      throw new Error('KAPSO_API_KEY not found in environment variables');
    }

    let templateData: WhatsAppTemplate;
    let templateIdToUse: string;

    if (messageId) {
      // Get pending message from database
      const { data: message } = await supabase
        .from('birthday_messages')
        .select('*')
        .eq('id', messageId)
        .eq('status', 'pending')
        .single();

      if (!message) {
        throw new Error('Message not found or already sent');
      }

      templateData = {
        phone_number: message.recipient_number,
        template_name: message.template_name,
        language: message.language,
        template_parameters: message.template_parameters
      };
      
      // Use the specific Kapso template ID for birthday alerts
      templateIdToUse = '65838f7e-0da3-42fd-bfa7-4d05c1c3df2c';
    } else if (template && templateId) {
      templateData = template;
      templateIdToUse = templateId;
    } else {
      throw new Error('Either messageId or both template and templateId must be provided');
    }

    // Send message via Kapso API using the correct format
    const kapsoResponse = await fetch(`https://app.kapso.ai/api/v1/whatsapp_templates/${templateIdToUse}/send_template`, {
      method: 'POST',
      headers: {
        'X-API-Key': kapsoApiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        template: {
          phone_number: templateData.phone_number,
          template_parameters: templateData.template_parameters
        }
      }),
    });

    const kapsoResult = await kapsoResponse.json();

    if (!kapsoResponse.ok) {
      throw new Error(`Kapso API error: ${kapsoResult.message || 'Unknown error'}`);
    }

    // Update message status if this was a scheduled message
    if (messageId) {
      await supabase
        .from('birthday_messages')
        .update({
          status: 'sent',
          sent_at: new Date().toISOString()
        })
        .eq('id', messageId);
    }

    console.log('WhatsApp message sent successfully:', kapsoResult);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'WhatsApp message sent successfully',
        data: kapsoResult
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error sending WhatsApp message:', error);

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