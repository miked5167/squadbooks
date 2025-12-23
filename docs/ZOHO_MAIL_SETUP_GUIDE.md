# Zoho Mail Setup Guide for HuddleBooks

This guide will walk you through setting up professional email addresses for HuddleBooks using Zoho Mail (free plan).

You'll create:

- info@huddlebooks.ca
- support@huddlebooks.ca
- mike@huddlebooks.ca

---

## Part 1: Create Zoho Mail Account

### Step 1: Sign Up for Zoho Mail

1. **Go to Zoho Mail:**
   - Open: https://www.zoho.com/mail/
   - Click "Sign Up Now" or "Get Started Free"

2. **Choose Free Plan:**
   - You'll see different plans
   - Click "Forever Free" plan (supports up to 5 users - perfect for you!)
   - Click "Get Started" under the Free plan

3. **Enter Your Domain:**
   - Where it asks for your domain, enter: `huddlebooks.ca`
   - Click "Add Domain" or "Continue"

### Step 2: Create Your First Email Account

1. **Create Your Account:**
   - **Email Address:** `mike` (this will become mike@huddlebooks.ca)
   - **Password:** Create a strong password and save it somewhere safe
   - **First Name:** Mike
   - **Last Name:** [Your last name]
   - Click "Create Account" or "Continue"

2. **Verify Your Email:**
   - Zoho will send a verification email to your personal email
   - Click the verification link in that email

---

## Part 2: Verify Domain Ownership

Zoho needs to verify you own huddlebooks.ca before you can use it for email.

### Step 1: Get Verification Code

1. **After signing up, you'll see a "Verify Domain" screen**
   - If you don't see this, go to: Control Panel > Domains > huddlebooks.ca

2. **Choose TXT Method:**
   - Select "TXT Method" (recommended)
   - You'll see a verification code like: `zoho-verification=xxxxxxxxxxxxx.zmverify.zoho.com`
   - **Copy this code** - you'll add it to GoDaddy

### Step 2: Add Verification Record in GoDaddy

1. **Open GoDaddy DNS Management:**
   - Log into GoDaddy: https://www.godaddy.com
   - Go to "My Products" > DNS next to huddlebooks.ca

2. **Add TXT Record:**
   - Click "Add" button
   - **Type:** TXT
   - **Name:** `@`
   - **Value:** Paste the verification code from Zoho
   - **TTL:** 1 hour
   - Click "Save"

3. **Wait and Verify:**
   - Wait 10-30 minutes for DNS to update
   - Go back to Zoho
   - Click "Verify by TXT Method"
   - If verified, you'll see a green checkmark!
   - If not, wait another 30 minutes and try again

---

## Part 3: Configure MX Records (For Receiving Emails)

MX records tell email servers where to deliver emails sent to @huddlebooks.ca addresses.

### Step 1: Get MX Record Values from Zoho

1. **In Zoho, you should see an MX Records section**
   - If not, go to: Control Panel > Domains > huddlebooks.ca > Email Configuration

2. **You'll see these MX records to add:**
   - Primary: `mx.zoho.com` (Priority: 10)
   - Secondary: `mx2.zoho.com` (Priority: 20)
   - Tertiary: `mx3.zoho.com` (Priority: 50)

### Step 2: Add MX Records in GoDaddy

1. **In GoDaddy DNS Management, click "Add"**

2. **Add First MX Record:**
   - **Type:** MX
   - **Name:** `@`
   - **Value:** `mx.zoho.com`
   - **Priority:** `10`
   - **TTL:** 1 hour
   - Click "Save"

3. **Add Second MX Record:**
   - Click "Add" again
   - **Type:** MX
   - **Name:** `@`
   - **Value:** `mx2.zoho.com`
   - **Priority:** `20`
   - **TTL:** 1 hour
   - Click "Save"

4. **Add Third MX Record:**
   - Click "Add" again
   - **Type:** MX
   - **Name:** `@`
   - **Value:** `mx3.zoho.com`
   - **Priority:** `50`
   - **TTL:** 1 hour
   - Click "Save"

**IMPORTANT:** If you have existing MX records (like GoDaddy's default ones), delete them. You should only have the 3 Zoho MX records.

---

## Part 4: Update SPF Record (For Sending Emails)

SPF records tell receiving mail servers that Zoho is authorized to send emails on behalf of huddlebooks.ca.

### Step 1: Update Existing SPF Record

**Remember:** You already added an SPF record for Resend in the GoDaddy DNS Setup Guide. Now you need to update it to include both Resend and Zoho.

1. **In GoDaddy DNS Management, find the TXT record:**
   - **Type:** TXT
   - **Name:** `@`
   - **Value:** Currently says `v=spf1 include:resend.com ~all`

2. **Click the pencil icon to edit it**

3. **Update the value to include both Resend and Zoho:**

   ```
   v=spf1 include:resend.com include:zoho.com ~all
   ```

4. **Click "Save"**

---

## Part 5: Create Additional Email Accounts

Now that your domain is verified, create the other email addresses you need.

### Create info@huddlebooks.ca

1. **In Zoho Mail, go to:**
   - Control Panel > User Details
   - Or: https://mailadmin.zoho.com/cpanel/home.do#users/users

2. **Click "Add User"**

3. **Fill in details:**
   - **Email Address:** `info`
   - **First Name:** Info
   - **Last Name:** HuddleBooks
   - **Password:** Create a password
   - Click "Create"

### Create support@huddlebooks.ca

1. **Click "Add User" again**

2. **Fill in details:**
   - **Email Address:** `support`
   - **First Name:** Support
   - **Last Name:** HuddleBooks
   - **Password:** Create a password
   - Click "Create"

---

## Part 6: Access Your Email

You have several options to access your email:

### Option 1: Zoho Mail Web Interface (Recommended for starting)

1. **Go to:** https://mail.zoho.com
2. **Sign in with:**
   - Email: mike@huddlebooks.ca
   - Password: [password you created]

3. **Switch between accounts:**
   - Click your profile icon in the top right
   - Click "Switch Account"
   - Choose info@, support@, or mike@

### Option 2: Email Client (Outlook, Apple Mail, etc.)

You can set up Zoho Mail in any email client:

**IMAP Settings (for receiving):**

- **Server:** imap.zoho.com
- **Port:** 993
- **Security:** SSL/TLS
- **Username:** mike@huddlebooks.ca
- **Password:** [your password]

**SMTP Settings (for sending):**

- **Server:** smtp.zoho.com
- **Port:** 465
- **Security:** SSL
- **Username:** mike@huddlebooks.ca
- **Password:** [your password]

### Option 3: Zoho Mail Mobile App

1. **Download Zoho Mail app:**
   - iOS: https://apps.apple.com/app/zoho-mail/id909262651
   - Android: https://play.google.com/store/apps/details?id=com.zoho.mail

2. **Sign in with mike@huddlebooks.ca**

---

## Part 7: Set Up Email Forwarding (Optional)

If you want emails to info@ and support@ to go to mike@, you can set up forwarding:

1. **In Zoho Mail Admin Panel:**
   - Go to: Control Panel > Email Forwarding
   - Or: https://mailadmin.zoho.com/cpanel/home.do#domains/emailforwarding

2. **Add Forwarding Rule:**
   - **From:** info@huddlebooks.ca
   - **To:** mike@huddlebooks.ca
   - Click "Add"

3. **Repeat for support@:**
   - **From:** support@huddlebooks.ca
   - **To:** mike@huddlebooks.ca
   - Click "Add"

Now all emails sent to info@ and support@ will automatically forward to mike@.

---

## Part 8: Test Your Email

### Test Receiving Emails

1. **From your personal email (Gmail, etc.):**
   - Send a test email to mike@huddlebooks.ca
   - Subject: "Test email"
   - Body: "Testing my new HuddleBooks email!"

2. **Check Zoho Mail:**
   - Go to https://mail.zoho.com
   - Sign in as mike@huddlebooks.ca
   - You should see the test email in your inbox (may take 1-5 minutes)

3. **Test other addresses:**
   - Send emails to info@huddlebooks.ca and support@huddlebooks.ca
   - Check if they arrive (or forward to mike@ if you set up forwarding)

### Test Sending Emails

1. **In Zoho Mail (https://mail.zoho.com):**
   - Click "Compose"
   - Send an email to your personal email
   - Check your personal email inbox - you should receive it from mike@huddlebooks.ca

---

## Troubleshooting

### Not receiving emails

**Possible causes:**

1. **MX records not propagated yet**
   - Solution: Wait 24-48 hours after adding MX records
   - Check DNS: https://mxtoolbox.com/SuperTool.aspx (enter huddlebooks.ca)

2. **MX records incorrect**
   - Solution: Double-check you added all 3 MX records correctly in GoDaddy
   - Delete any old/default MX records

3. **Domain not verified in Zoho**
   - Solution: Go to Zoho Control Panel > Domains > huddlebooks.ca
   - Make sure you see a green checkmark next to "Verified"

### Can't send emails

**Possible causes:**

1. **SPF record not set up correctly**
   - Solution: Check the SPF TXT record in GoDaddy
   - Should be: `v=spf1 include:resend.com include:zoho.com ~all`

2. **Password incorrect**
   - Solution: Reset password in Zoho Control Panel > User Details

### Emails going to spam

**Solution:**

1. **Add DKIM record** (improves email deliverability)
   - In Zoho: Control Panel > Domains > Email Configuration > DKIM
   - Copy the TXT record Zoho provides
   - Add it to GoDaddy DNS (Type: TXT)

2. **Ask recipients to mark as "Not Spam"**
   - This trains their email provider

---

## Summary: What You've Accomplished

✅ Created Zoho Mail account
✅ Verified domain ownership
✅ Set up MX records for receiving emails
✅ Updated SPF record for sending emails
✅ Created 3 email addresses:

- mike@huddlebooks.ca
- info@huddlebooks.ca
- support@huddlebooks.ca
  ✅ Can send and receive emails from all addresses

---

## Email Best Practices

### Security

- Use strong, unique passwords for each email account
- Enable 2-factor authentication in Zoho settings (recommended)
- Never share your email password

### Professional Communication

- Set up email signatures:
  - Go to Zoho Mail > Settings > Email Signatures
  - Add your name, title, and HuddleBooks branding

### Organization

- Create folders for different types of emails (Demo Requests, Support, etc.)
- Set up filters to automatically organize incoming emails
- Use labels and tags to categorize emails

---

## Next Steps

✅ Your email is set up!

All your deployment guides are complete:

- ✅ Vercel Deployment Guide
- ✅ GoDaddy DNS Setup Guide
- ✅ Zoho Mail Setup Guide

**Follow the guides in this order:**

1. Vercel Deployment Guide (deploy your site)
2. GoDaddy DNS Setup Guide (connect your domain)
3. Zoho Mail Setup Guide (set up email addresses)

**After completing all three, your HuddleBooks landing page will be live at www.huddlebooks.ca with working contact forms and professional email addresses!**
