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

  let messageId: string | undefined;

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { messageId: reqMessageId, template, templateId }: { 
      messageId?: string; 
      template?: WhatsAppTemplate; 
      templateId?: string; 
    } = await req.json();

    messageId = reqMessageId;

    // Get Kapso API key from secrets
    const kapsoApiKey = Deno.env.get('KAPSO_API_KEY');
    if (!kapsoApiKey) {
      throw new Error('KAPSO_API_KEY not found in environment variables');
    }

    let templateData: WhatsAppTemplate;
    let templateIdToUse: string;

    if (messageId) {
      // Get pending message from database with better error handling
      const { data: messages, error: messageError } = await supabase
        .from('birthday_messages')
        .select('*')
        .eq('id', messageId)
        .in('status', ['pending', 'processing']);

      if (messageError) {
        throw new Error(`Database error: ${messageError.message}`);
      }

      if (!messages || messages.length === 0) {
        throw new Error(`Message not found or already processed: ${messageId}`);
      }

      if (messages.length > 1) {
        // Multiple messages found - this shouldn't happen, but let's handle it
        console.warn(`Multiple messages found for ID ${messageId}, using the first one`);
      }

      const message = messages[0];

      console.log('Processing message:', {
        id: message.id,
        template_name: message.template_name,
        recipient_number: message.recipient_number,
        parameters: message.template_parameters
      });

      templateData = {
        phone_number: message.recipient_number,
        template_name: message.template_name,
        language: message.language,
        template_parameters: message.template_parameters
      };
      
      // Use different Kapso template IDs based on message type
      if (message.template_name === 'birthday_alert_arg') {
        templateIdToUse = 'e72d608c-efc2-4d13-8b71-6f762ff2e62f'; // Birthday reminder template
      } else if (message.template_name === 'welcome_birthday') {
        templateIdToUse = '578b0acd-e167-4f27-be4d-10922344dd10'; // Group confirmation template
      } else {
        throw new Error(`Unknown template name: ${message.template_name}`);
      }
    } else if (template && templateId) {
      templateData = template;
      templateIdToUse = templateId;
    } else {
      throw new Error('Either messageId or both template and templateId must be provided');
    }

    console.log('Sending WhatsApp message via Kapso:', {
      templateId: templateIdToUse,
      phoneNumber: templateData.phone_number,
      parameters: templateData.template_parameters
    });

    // Validate phone number format
    if (!templateData.phone_number || !templateData.phone_number.startsWith('+')) {
      const errorMsg = `Invalid phone number format: ${templateData.phone_number}. Must start with +`;
      if (messageId) {
        await supabase
          .from('birthday_messages')
          .update({
            status: 'failed',
            error_message: errorMsg,
            sent_at: new Date().toISOString()
          })
          .eq('id', messageId);
      }
      throw new Error(errorMsg);
    }

    // Validate template parameters
    if (!Array.isArray(templateData.template_parameters)) {
      const errorMsg = 'Template parameters must be an array';
      if (messageId) {
        await supabase
          .from('birthday_messages')
          .update({
            status: 'failed',
            error_message: errorMsg,
            sent_at: new Date().toISOString()
          })
          .eq('id', messageId);
      }
      throw new Error(errorMsg);
    }

    // Send message via Kapso API using the correct format
    const kapsoUrl = `https://app.kapso.ai/api/v1/whatsapp_templates/${templateIdToUse}/send_template`;
    console.log('Kapso API URL:', kapsoUrl);

    const requestBody = {
      template: {
        phone_number: templateData.phone_number,
        template_parameters: templateData.template_parameters
      }
    };

    console.log('Kapso API request body:', JSON.stringify(requestBody, null, 2));

    const kapsoResponse = await fetch(kapsoUrl, {
      method: 'POST',
      headers: {
        'X-API-Key': kapsoApiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    console.log('Kapso API response status:', kapsoResponse.status);
    console.log('Kapso API response headers:', Object.fromEntries(kapsoResponse.headers.entries()));

    const kapsoResult = await kapsoResponse.json();
    console.log('Kapso API response body:', kapsoResult);

    // Only mark as sent if Kapso actually succeeded
    if (kapsoResponse.ok && kapsoResult.success !== false) {
      // Update message status to sent only if Kapso succeeded
      if (messageId) {
        const { error: updateError } = await supabase
          .from('birthday_messages')
          .update({
            status: 'sent',
            sent_at: new Date().toISOString()
          })
          .eq('id', messageId);

        if (updateError) {
          console.error('Error updating message status:', updateError);
        }
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
    } else {
      // Kapso failed - mark message as failed
      const errorMessage = `Kapso API error (${kapsoResponse.status}): ${kapsoResult.message || kapsoResult.error || 'Unknown error'}`;
      
      if (messageId) {
        const { error: updateError } = await supabase
          .from('birthday_messages')
          .update({
            status: 'failed',
            error_message: errorMessage,
            sent_at: new Date().toISOString()
          })
          .eq('id', messageId);

        if (updateError) {
          console.error('Error updating failed message status:', updateError);
        }
      }

      throw new Error(errorMessage);
    }

  } catch (error) {
    console.error('Error sending WhatsApp message:', error);

    // Update message status to failed if we have a messageId
    if (messageId) {
      try {
        const supabase = createClient(
          Deno.env.get('SUPABASE_URL') ?? '',
          Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );

        const { error: updateError } = await supabase
          .from('birthday_messages')
          .update({
            status: 'failed',
            error_message: error.message,
            sent_at: new Date().toISOString()
          })
          .eq('id', messageId);

        if (updateError) {
          console.error('Error updating failed message status:', updateError);
        }
      } catch (updateError) {
        console.error('Error updating failed message status:', updateError);
      }
    }

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