# HuddleBooks Landing Page Deployment - START HERE

Welcome! This guide will help you deploy your HuddleBooks landing page to www.huddlebooks.ca.

## What You're Deploying

Your HuddleBooks landing page with:

- ✅ Optimized copy targeting Ontario hockey association Presidents/Treasurers
- ✅ Working demo request form (sends emails to mike@huddlebooks.ca)
- ✅ Working email signup form (sends confirmation emails)
- ✅ Professional domain: www.huddlebooks.ca
- ✅ Professional email addresses: mike@, info@, and support@huddlebooks.ca

## What You'll Need

Before starting, make sure you have:

- ✅ GoDaddy account with huddlebooks.ca domain (you already have this!)
- ⏳ A Vercel account (we'll create this)
- ⏳ A Resend account (we'll create this - for sending emails)
- ⏳ A Zoho Mail account (we'll create this - for email addresses)

All of these are **free** to set up!

## Time Estimate

- **Vercel Deployment:** 30-45 minutes
- **GoDaddy DNS Setup:** 20-30 minutes
- **Zoho Mail Setup:** 30-45 minutes
- **Total:** ~2 hours (plus 24-48 hours for DNS to fully propagate)

## Step-by-Step Deployment Process

Follow these guides **in order**:

### Step 1: Deploy to Vercel

📄 **Guide:** `docs/VERCEL_DEPLOYMENT_GUIDE.md`

What you'll do:

1. Create a Resend account and get your API key (for sending emails from forms)
2. Create a Vercel account and connect it to your GitHub
3. Import your squadbooks repository
4. Add environment variables (API keys)
5. Deploy your site to a temporary URL (like huddlebooks.vercel.app)
6. Get DNS records for connecting your custom domain

**When you're done:** Your site will be live at a temporary Vercel URL, but not yet at www.huddlebooks.ca

---

### Step 2: Connect Your Domain (GoDaddy DNS)

📄 **Guide:** `docs/GODADDY_DNS_SETUP_GUIDE.md`

What you'll do:

1. Log into GoDaddy
2. Add Vercel DNS records (to point www.huddlebooks.ca to your site)
3. Add Resend DNS records (to verify you own the domain for sending emails)
4. Add Zoho DNS records (to set up email addresses - you'll get these from Step 3)

**When you're done:** www.huddlebooks.ca will point to your landing page (may take 24-48 hours)

---

### Step 3: Set Up Email Addresses (Zoho Mail)

📄 **Guide:** `docs/ZOHO_MAIL_SETUP_GUIDE.md`

What you'll do:

1. Create a free Zoho Mail account
2. Verify you own huddlebooks.ca
3. Add MX records in GoDaddy (for receiving emails)
4. Update SPF record (for sending emails)
5. Create email accounts: mike@, info@, support@huddlebooks.ca
6. Test sending and receiving emails

**When you're done:** You'll have 3 working professional email addresses!

---

## What Happens After DNS Propagation

**DNS propagation** means your domain name changes are spreading across the internet. This can take 24-48 hours, but often works within a few hours.

Once DNS has propagated:

- ✅ www.huddlebooks.ca will show your landing page
- ✅ Demo request forms will send emails to mike@huddlebooks.ca
- ✅ Email signup forms will send confirmation emails to subscribers
- ✅ You can send and receive emails from mike@, info@, and support@huddlebooks.ca

## Testing Your Deployment

After completing all 3 steps and waiting for DNS to propagate:

### 1. Test Website Access

- Open a private/incognito browser window
- Go to: https://www.huddlebooks.ca
- You should see your landing page

### 2. Test Demo Request Form

- Scroll to "Request a Demo" section
- Fill out the form with test data
- Submit the form
- Check mike@huddlebooks.ca inbox - you should receive the demo request

### 3. Test Email Signup Form

- Scroll to "Get Updates" section
- Enter a test email address
- Click "Get Notified"
- Check that email's inbox - you should receive a confirmation email

### 4. Test Email Sending

- Go to https://mail.zoho.com
- Sign in as mike@huddlebooks.ca
- Send a test email to your personal email
- Verify it arrives and shows "from mike@huddlebooks.ca"

## Troubleshooting

### "This site can't be reached" when visiting www.huddlebooks.ca

- **Cause:** DNS hasn't propagated yet
- **Solution:** Wait 2-24 hours and try again
- **Check:** Use https://dnschecker.org to see if DNS has propagated globally

### Forms aren't sending emails

- **Cause 1:** Resend domain not verified
  - **Solution:** Check Resend dashboard - domain should show green checkmarks
- **Cause 2:** Environment variables not set in Vercel
  - **Solution:** Check Vercel project settings > Environment Variables
- **Cause 3:** DNS records missing or incorrect
  - **Solution:** Review GoDaddy DNS Setup Guide and verify all records are added

### Emails to @huddlebooks.ca aren't being received

- **Cause:** MX records not set up or not propagated
- **Solution:** Check GoDaddy DNS - you should have 3 MX records (mx.zoho.com, mx2.zoho.com, mx3.zoho.com)
- **Wait:** Can take 24-48 hours for MX records to propagate
- **Test:** Use https://mxtoolbox.com to verify MX records are working

### Emails are going to spam

- **Solution 1:** Ask recipients to mark as "Not Spam"
- **Solution 2:** Add DKIM record from Zoho (see Zoho Mail Setup Guide)
- **Solution 3:** Give it time - email reputation improves over first few weeks

## Need Help?

All the detailed guides are in the `docs/` folder:

- `VERCEL_DEPLOYMENT_GUIDE.md`
- `GODADDY_DNS_SETUP_GUIDE.md`
- `ZOHO_MAIL_SETUP_GUIDE.md`

Each guide has:

- Step-by-step instructions with screenshots descriptions
- Copy/paste values for all settings
- Troubleshooting sections
- Links to helpful tools

## Updating Your Site After Deployment

After your initial deployment, making updates is easy!

### To update copy or code:

1. Make changes to your code locally
2. Commit changes: `git add . && git commit -m "your message"`
3. Push to GitHub: `git push origin code-review-request`
4. Vercel will automatically detect the changes and redeploy
5. Changes will be live in 2-3 minutes!

You don't need to do anything in Vercel - it automatically redeploys when you push to GitHub.

## Summary

Here's what you're about to accomplish:

**Before:**

- Landing page only visible on localhost (your computer)
- Forms don't send real emails
- No professional email addresses

**After:**

- Landing page live at www.huddlebooks.ca
- Demo requests automatically emailed to mike@huddlebooks.ca
- Email signups send automatic confirmation emails
- Professional email addresses: mike@, info@, support@huddlebooks.ca
- Automatic redeployment when you push code changes to GitHub

## Ready to Start?

1. Open `docs/VERCEL_DEPLOYMENT_GUIDE.md`
2. Follow the steps carefully
3. Take your time - no rush!
4. Move to the next guide when you're done

**Good luck! You've got this! 🚀**
