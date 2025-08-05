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

    // Get all pending or processing birthday messages
    const { data: pendingMessages, error } = await supabase
      .from('birthday_messages')
      .select('*')
      .in('status', ['pending', 'processing']);

    if (error) {
      throw error;
    }

    if (!pendingMessages || pendingMessages.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No pending or processing messages to process' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Processing ${pendingMessages.length} pending/processing birthday messages`);

    const results = [];

    for (const message of pendingMessages) {
      try {
        // Call the send-whatsapp-message function
        const sendResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/send-whatsapp-message`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ messageId: message.id }),
        });

        const sendResult = await sendResponse.json();

        if (sendResult.success) {
          results.push({ messageId: message.id, status: 'sent' });
          console.log(`Message ${message.id} sent successfully`);
        } else {
          // Update message status to failed
          await supabase
            .from('birthday_messages')
            .update({
              status: 'failed',
              error_message: sendResult.error
            })
            .eq('id', message.id);
          
          results.push({ messageId: message.id, status: 'failed', error: sendResult.error });
          console.error(`Failed to send message ${message.id}:`, sendResult.error);
        }
      } catch (messageError) {
        // Update message status to failed
        await supabase
          .from('birthday_messages')
          .update({
            status: 'failed',
            error_message: messageError.message
          })
          .eq('id', message.id);
        
        results.push({ messageId: message.id, status: 'failed', error: messageError.message });
        console.error(`Error processing message ${message.id}:`, messageError);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Processed ${pendingMessages.length} messages`,
        results
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error processing birthday reminders:', error);

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