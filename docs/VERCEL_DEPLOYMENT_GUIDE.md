# Vercel Deployment Guide for HuddleBooks Landing Page

This guide will walk you through deploying your HuddleBooks landing page to Vercel, step by step. No coding experience required!

## Prerequisites

- Your GitHub repository is at: https://github.com/miked5167/squadbooks
- You need a Resend API key for sending emails (we'll get this)

---

## Part 1: Get Your Resend API Key (For Email Functionality)

1. **Go to Resend:**
   - Open your browser and go to: https://resend.com
   - Click "Sign Up" (or "Log In" if you already have an account)

2. **Sign up with your email:**
   - Use mike@huddlebooks.ca or your personal email
   - Verify your email address

3. **Add your domain:**
   - In the Resend dashboard, click "Domains" in the left sidebar
   - Click "Add Domain"
   - Enter: `huddlebooks.ca`
   - You'll see DNS records to add - **keep this tab open**, we'll add these in the GoDaddy DNS setup later

4. **Get your API Key:**
   - Click "API Keys" in the left sidebar
   - Click "Create API Key"
   - Name it: "HuddleBooks Production"
   - Permission: "Sending access"
   - Click "Create"
   - **COPY THIS KEY AND SAVE IT SOMEWHERE SAFE** - you won't be able to see it again!
   - It will look like: `re_xxxxxxxxxxxxxxxxxxxxxxxxxxxx`

---

## Part 2: Deploy to Vercel

### Step 1: Create Vercel Account

1. **Go to Vercel:**
   - Open: https://vercel.com
   - Click "Sign Up"

2. **Sign up with GitHub:**
   - Click "Continue with GitHub"
   - This will connect your GitHub account to Vercel
   - Authorize Vercel to access your GitHub repositories

### Step 2: Import Your Project

1. **Import Git Repository:**
   - You should see a "Import Git Repository" button
   - Click it, or go to: https://vercel.com/new
   - You'll see a list of your GitHub repositories

2. **Select squadbooks repository:**
   - Find "miked5167/squadbooks" in the list
   - Click "Import" next to it

3. **Configure Project:**
   - **Project Name:** Change this to `huddlebooks` (lowercase, no spaces)
   - **Framework Preset:** Should auto-detect "Next.js" - leave this
   - **Root Directory:** Leave as `./` (default)
   - **Build and Output Settings:** Leave default

### Step 3: Add Environment Variables

This is where we tell Vercel how to send emails!

1. **Open Environment Variables:**
   - Scroll down to "Environment Variables" section
   - Click to expand it

2. **Add RESEND_API_KEY:**
   - **Name:** `RESEND_API_KEY`
   - **Value:** Paste the API key you copied from Resend (starts with `re_`)
   - Click "Add"

3. **Add NEXT_PUBLIC_APP_URL:**
   - **Name:** `NEXT_PUBLIC_APP_URL`
   - **Value:** `https://www.huddlebooks.ca`
   - Click "Add"

4. **Add NODE_ENV:**
   - **Name:** `NODE_ENV`
   - **Value:** `production`
   - Click "Add"

### Step 4: Deploy!

1. **Click "Deploy"**
   - Vercel will now build and deploy your site
   - This will take 2-3 minutes
   - You'll see a progress screen with logs

2. **Wait for "Congratulations!"**
   - When you see confetti and "Congratulations!", your site is live!
   - You'll see a URL like: `https://huddlebooks.vercel.app`
   - Click "Visit" to see your live landing page

3. **Test the URL:**
   - You should see your HuddleBooks landing page
   - The URL will be something like: `https://huddlebooks-xxxxx.vercel.app`
   - **Save this URL** - we'll need it for testing

---

## Part 3: Connect Your Custom Domain (www.huddlebooks.ca)

### Step 1: Add Domain in Vercel

1. **Go to Project Settings:**
   - In your Vercel dashboard, click on your "huddlebooks" project
   - Click "Settings" at the top
   - Click "Domains" in the left sidebar

2. **Add Domain:**
   - You'll see a box that says "Enter a domain..."
   - Type: `www.huddlebooks.ca`
   - Click "Add"

3. **Add Root Domain:**
   - Click "Add" again
   - Type: `huddlebooks.ca` (without www)
   - Click "Add"

4. **Copy DNS Instructions:**
   - Vercel will show you DNS records you need to add
   - It will look something like this:

     ```
     Type: CNAME
     Name: www
     Value: cname.vercel-dns.com

     Type: A
     Name: @
     Value: 76.76.21.21
     ```

   - **Keep this page open** - we'll use these in the GoDaddy DNS setup

---

## Part 4: Test Your Forms

**IMPORTANT:** Wait until AFTER you've completed the GoDaddy DNS setup (next guide) before testing forms. The forms will only work once:

1. Your domain is connected (DNS setup complete)
2. You've verified your domain in Resend (using the DNS records from Resend)

Once both are done, test the forms:

1. **Go to your live site:** https://www.huddlebooks.ca

2. **Test Email Signup:**
   - Scroll to "Get Updates" section
   - Enter a test email
   - Click "Get Notified"
   - You should see: "Thanks! Check your email."
   - Check the email inbox you used - you should get a confirmation email

3. **Test Demo Request:**
   - Scroll to "Request a Demo" section
   - Fill out the form with your name, email, role, and message
   - Click "Request Demo"
   - You should see: "Request Received!"
   - Check mike@huddlebooks.ca - you should receive the demo request email

---

## Troubleshooting

### Forms aren't working

- Check that you added all environment variables correctly in Vercel
- Make sure you've added the Resend DNS records in GoDaddy
- Make sure you've verified your domain in Resend
- Wait 24-48 hours after adding DNS records (DNS can take time to propagate)

### "This site can't be reached"

- DNS records may not have propagated yet (wait 24-48 hours)
- Double-check your DNS records in GoDaddy match what Vercel shows

### Need to update the site

1. Make changes to your code locally
2. Commit and push to GitHub: `git push origin code-review-request`
3. Vercel will automatically detect the changes and redeploy!
4. Updates will be live in 2-3 minutes

---

## Next Steps

✅ You've deployed to Vercel!

Now continue with:

- **GoDaddy DNS Setup Guide** (to connect your domain)
- **Zoho Mail Setup Guide** (to create your email addresses)
