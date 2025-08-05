-- Reset any existing 'processing' status messages back to 'pending'
-- This ensures they can be processed by the Edge Function

UPDATE public.birthday_messages 
SET status = 'pending' 
WHERE status = 'processing';

-- Also reset any 'sent' messages from today that were marked by the placeholder function
-- (these were never actually sent via WhatsApp)
UPDATE public.birthday_messages 
SET status = 'pending', sent_at = NULL 
WHERE status = 'sent' 
AND DATE(created_at) = CURRENT_DATE
AND error_message IS NULL; 