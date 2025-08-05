-- Fix phone number formats for WhatsApp messaging
-- This script adds the missing + prefix and country codes to phone numbers

-- First, let's see what we're working with
SELECT 
  id,
  name,
  whatsapp_number,
  CASE 
    WHEN whatsapp_number LIKE '+%' THEN 'Correct format'
    WHEN whatsapp_number LIKE '54%' THEN 'Missing + prefix'
    WHEN whatsapp_number LIKE '11%' THEN 'Missing +54 prefix'
    ELSE 'Unknown format'
  END as format_status
FROM group_members 
WHERE whatsapp_number IS NOT NULL 
AND whatsapp_number != '';

-- Fix phone numbers that start with 54 (Argentina country code) but missing +
UPDATE group_members 
SET whatsapp_number = CONCAT('+', whatsapp_number)
WHERE whatsapp_number LIKE '54%' 
AND whatsapp_number NOT LIKE '+%';

-- Fix phone numbers that start with 11 (Buenos Aires area code) but missing +54
UPDATE group_members 
SET whatsapp_number = CONCAT('+54', whatsapp_number)
WHERE whatsapp_number LIKE '11%' 
AND whatsapp_number NOT LIKE '+%'
AND LENGTH(whatsapp_number) = 10;

-- Fix phone numbers that are just 9 digits (assuming Argentina)
UPDATE group_members 
SET whatsapp_number = CONCAT('+54', whatsapp_number)
WHERE whatsapp_number ~ '^[0-9]{9}$'
AND whatsapp_number NOT LIKE '+%';

-- Verify the fixes
SELECT 
  id,
  name,
  whatsapp_number,
  CASE 
    WHEN whatsapp_number LIKE '+%' THEN '✅ Correct format'
    ELSE '❌ Still needs fixing'
  END as format_status
FROM group_members 
WHERE whatsapp_number IS NOT NULL 
AND whatsapp_number != ''
ORDER BY format_status DESC;

-- Reset failed messages to pending for retry
UPDATE birthday_messages 
SET status = 'pending', error_message = NULL, sent_at = NULL
WHERE status = 'failed' 
AND DATE(created_at) = CURRENT_DATE; 