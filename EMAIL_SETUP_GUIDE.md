# Email Confirmation Setup Guide for Supabase

## Problem
Users are not receiving confirmation emails when signing up. This is a common issue with Supabase's default email service, which is intended for demo purposes only and has very low rate limits.

## Root Causes
1. **Default Email Service**: Supabase's built-in email service (`noreply@mail.supabase.io`) has severe limitations
2. **Rate Limits**: Very low sending limits (often just a few emails per hour)
3. **Spam Issues**: Default emails often end up in spam folders
4. **No Custom Branding**: Default emails don't match your brand

## Solutions

### 1. Immediate Fixes (Temporary)

#### A. Check Supabase Dashboard Settings
1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Navigate to **Authentication > Settings**
3. Ensure these settings are correct:
   - ✅ **Enable email confirmations**: ON
   - ✅ **Enable email change confirmations**: ON (optional)
   - ✅ **Enable sign ups**: ON
   - ✅ **Redirect URLs**: Include your production and local URLs

#### B. Verify Email Templates
1. In Supabase Dashboard, go to **Authentication > Email Templates**
2. Customize the confirmation email template
3. Make sure the redirect URL is correct: `{{ .SiteURL }}/auth`

#### C. Test with Different Email Providers
- Try Gmail, Outlook, or other major providers
- Avoid temporary email services
- Check spam/junk folders

### 2. Recommended Solution: Custom SMTP Setup

#### A. Choose an Email Service Provider
Popular options:
- **SendGrid** (Free tier: 100 emails/day)
- **Mailgun** (Free tier: 1,000 emails/month)
- **Amazon SES** (Very cheap, $0.10 per 1,000 emails)
- **Postmark** (Free tier: 100 emails/month)
- **Brevo (Sendinblue)** (Free tier: 300 emails/day)

#### B. Configure SMTP in Supabase
1. Go to **Supabase Dashboard > Authentication > Settings > SMTP**
2. Enable custom SMTP
3. Configure with your provider's settings:

**Example for SendGrid:**
```
SMTP Host: smtp.sendgrid.net
SMTP Port: 587
SMTP User: apikey
SMTP Pass: [Your SendGrid API Key]
From Address: noreply@yourdomain.com
```

**Example for Mailgun:**
```
SMTP Host: smtp.mailgun.org
SMTP Port: 587
SMTP User: [Your Mailgun SMTP Username]
SMTP Pass: [Your Mailgun SMTP Password]
From Address: noreply@yourdomain.com
```

#### C. DNS Configuration (If using custom domain)
Add these DNS records for better deliverability:
- **SPF Record**: `v=spf1 include:sendgrid.net ~all` (adjust for your provider)
- **DKIM**: Add the DKIM record provided by your email service
- **DMARC**: `v=DMARC1; p=none; rua=mailto:admin@yourdomain.com`

### 3. Testing Email Delivery

#### A. Use Email Testing Tools
- **Mailtrap**: Test emails without sending to real users
- **MailHog**: Local email testing
- **Ethereal Email**: Online email testing

#### B. Test Your Setup
1. Try signing up with a test email
2. Check delivery logs in your email provider
3. Monitor spam folder placement
4. Test with different email providers

### 4. Troubleshooting Common Issues

#### Issue: Emails go to spam
**Solutions:**
- Set up proper DNS records (SPF, DKIM, DMARC)
- Use a dedicated IP address
- Warm up your domain gradually
- Use a reputable email service

#### Issue: Rate limiting
**Solutions:**
- Implement exponential backoff for retries
- Queue emails during high traffic
- Upgrade your email service plan

#### Issue: Email bounces
**Solutions:**
- Keep a clean email list
- Remove bounced emails promptly
- Monitor your sender reputation

### 5. Code Implementation

Your updated authentication code now includes:
- ✅ Better error handling for email issues
- ✅ Resend confirmation email functionality
- ✅ User-friendly pending confirmation UI
- ✅ Clear instructions for users

### 6. Monitoring and Maintenance

#### Track Email Metrics
- Delivery rates
- Open rates
- Bounce rates
- Spam complaints

#### Regular Maintenance
- Monitor email logs
- Update DNS records as needed
- Keep email lists clean
- Review and update templates

## Quick Setup Steps

1. **Immediate**: Test current setup with different email providers
2. **Short-term**: Set up custom SMTP with SendGrid or similar
3. **Long-term**: Configure proper DNS authentication records
4. **Ongoing**: Monitor email deliverability metrics

## Need Help?

If you continue having issues after following this guide:
1. Check your email service provider's logs
2. Verify DNS records are properly configured
3. Test with email delivery testing tools
4. Consider reaching out to Supabase support with specific error messages

---

**Next Steps**: I recommend starting with SendGrid's free tier as it's the easiest to set up and provides good deliverability out of the box. 