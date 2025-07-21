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

    const { messageId, template }: { messageId?: string; template?: WhatsAppTemplate } = await req.json();

    // Get user's Kapso API key
    const { data: config } = await supabase
      .from('whatsapp_config')
      .select('api_key')
      .eq('is_active', true)
      .single();

    if (!config?.api_key) {
      throw new Error('No active WhatsApp configuration found');
    }

    let templateData: WhatsAppTemplate;

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
    } else if (template) {
      templateData = template;
    } else {
      throw new Error('Either messageId or template must be provided');
    }

    // Send message via Kapso API
    const kapsoResponse = await fetch('https://api.kapso.ai/v1/whatsapp/send-template', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.api_key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        template: templateData
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