# Email Notifications Setup Guide

Squadbooks uses [Resend](https://resend.com) for sending email notifications. Follow these steps to configure email notifications for your application.

## Prerequisites

1. A Resend account (free tier available)
2. A verified domain (or use Resend's test domain for development)

## Setup Steps

### 1. Create a Resend Account

1. Go to [resend.com](https://resend.com)
2. Sign up for a free account
3. Verify your email address

### 2. Get Your API Key

1. Log in to your Resend dashboard
2. Navigate to **API Keys** in the left sidebar
3. Click **Create API Key**
4. Give it a name (e.g., "Squadbooks Development")
5. Copy the API key (it will start with `re_`)

### 3. Configure Environment Variables

Add the following to your `.env.local` file:

```bash
# Email (Resend)
RESEND_API_KEY="re_your_api_key_here"
RESEND_FROM_EMAIL="Squadbooks <noreply@squadbooks.com>"
```

**Note:** For production, you'll need to verify your domain. For development/testing, you can use `onboarding@resend.dev` as the from email.

### 4. Verify Domain (Production Only)

For production use, you need to verify your domain:

1. Go to **Domains** in the Resend dashboard
2. Click **Add Domain**
3. Enter your domain (e.g., `squadbooks.com`)
4. Add the DNS records provided by Resend to your domain's DNS settings
5. Wait for verification (usually takes a few minutes)
6. Update `RESEND_FROM_EMAIL` to use your verified domain

## Email Templates

Squadbooks sends three types of emails:

### 1. Approval Request Email
**Sent to:** Assistant Treasurer
**When:** A treasurer creates an expense over $200
**Subject:** `Expense Approval Needed: $XXX - Vendor Name`
**Contains:** Transaction details, amount, vendor, category, receipt indicator, approve/reject buttons

### 2. Approval Confirmation Email
**Sent to:** Treasurer (transaction creator)
**When:** Assistant Treasurer approves the transaction
**Subject:** `Expense Approved: $XXX - Vendor Name`
**Contains:** Approval confirmation, approver name, timestamp, transaction details

### 3. Rejection Notification Email
**Sent to:** Treasurer (transaction creator)
**When:** Assistant Treasurer rejects the transaction
**Subject:** `Expense Rejected: $XXX - Vendor Name`
**Contains:** Rejection notice, reason/comment, next steps

## Testing Email Notifications

### Development Testing

For development, use Resend's test email (`onboarding@resend.dev`):

```bash
RESEND_FROM_EMAIL="onboarding@resend.dev"
```

All emails will be sent successfully, and you can view them in the Resend dashboard under **Emails**.

### Testing Flow

1. **Create Assistant Treasurer:**
   - Sign in as a user
   - Update their role to `ASSISTANT_TREASURER` in the database
   - Make sure they have a valid email address

2. **Create High-Value Transaction:**
   - Log in as a Treasurer
   - Create an expense transaction over $200
   - Check the Resend dashboard for the approval request email

3. **Approve/Reject Transaction:**
   - Log in as the Assistant Treasurer
   - Go to the Approvals page
   - Approve or reject the transaction
   - Check the Resend dashboard for the confirmation/rejection email

## Troubleshooting

### Emails Not Sending

1. **Check API Key:** Make sure `RESEND_API_KEY` is set correctly in `.env.local`
2. **Check Console:** Look for error messages in the server console
3. **Check Resend Dashboard:** Go to **Emails** to see if the email was processed
4. **Verify Domain:** For production, ensure your domain is verified in Resend

### Common Errors

**Error:** `Invalid API key`
**Solution:** Verify your `RESEND_API_KEY` is correct and not expired

**Error:** `Domain not verified`
**Solution:** Either use `onboarding@resend.dev` for testing or verify your domain in Resend

**Error:** `Rate limit exceeded`
**Solution:** You've hit the free tier limit (100 emails/day). Upgrade your plan or wait 24 hours.

## Rate Limits

### Free Tier
- 100 emails per day
- 3,000 emails per month
- Perfect for development and small teams

### Paid Plans
- Start at $20/month for 50,000 emails
- See [resend.com/pricing](https://resend.com/pricing) for details

## Email Delivery Best Practices

1. **Verify Your Domain:** Improves deliverability and prevents emails from going to spam
2. **Use a Real From Address:** Avoid generic addresses like `noreply@example.com`
3. **Monitor Bounce Rates:** Check the Resend dashboard for bounced emails
4. **Test Email Content:** Send test emails to ensure formatting looks good across email clients

## Security

- **Never commit `.env.local`** to version control
- **Rotate API keys regularly** (every 90 days recommended)
- **Use different API keys** for development and production
- **Monitor usage** in the Resend dashboard for suspicious activity

## Support

- **Resend Documentation:** [resend.com/docs](https://resend.com/docs)
- **Resend Support:** support@resend.com
- **Squadbooks Issues:** [GitHub Issues](https://github.com/miked5167/squadbooks/issues)
