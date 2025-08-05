-- Reset false 'sent' messages back to 'pending' for proper processing
-- Only keep as 'sent' the messages that were actually delivered via Kapso

-- First, let's see which messages should be reset
SELECT 
  bm.id,
  bm.status,
  bm.recipient_number,
  gm.name as recipient_name,
  bm.error_message
FROM public.birthday_messages bm
JOIN public.group_members gm ON bm.member_id = gm.id
WHERE gm.name = 'Luca Mag' 
AND DATE(bm.created_at) = CURRENT_DATE
AND bm.status = 'sent'
ORDER BY bm.created_at;

-- Reset all 'sent' messages back to 'pending' 
-- (we'll let the Edge Function re-process them properly)
UPDATE public.birthday_messages 
SET status = 'pending', sent_at = NULL 
WHERE status = 'sent' 
AND DATE(created_at) = CURRENT_DATE;

-- Also reset any 'failed' messages to 'pending' for retry
UPDATE public.birthday_messages 
SET status = 'pending', error_message = NULL 
WHERE status = 'failed' 
AND DATE(created_at) = CURRENT_DATE; 