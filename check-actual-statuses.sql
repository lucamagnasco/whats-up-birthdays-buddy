-- Check the actual statuses of all birthday messages for Luca Mag today
SELECT 
  bm.id,
  bm.status,
  bm.recipient_number,
  gm.name as recipient_name,
  bm.error_message,
  bm.created_at
FROM public.birthday_messages bm
JOIN public.group_members gm ON bm.member_id = gm.id
WHERE gm.name = 'Luca Mag' 
AND DATE(bm.created_at) = CURRENT_DATE
ORDER BY bm.created_at DESC;

-- Also check the count by status
SELECT 
  status,
  COUNT(*) as count
FROM public.birthday_messages 
WHERE DATE(created_at) = CURRENT_DATE
GROUP BY status
ORDER BY status; 