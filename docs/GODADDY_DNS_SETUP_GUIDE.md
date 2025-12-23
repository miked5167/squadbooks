# GoDaddy DNS Setup Guide for HuddleBooks

This guide will walk you through setting up DNS records in GoDaddy to:

1. Point www.huddlebooks.ca to your Vercel deployment
2. Set up email sending via Resend
3. Set up Zoho Mail for your email addresses

**IMPORTANT:** Have your Vercel deployment guide open - you'll need the DNS records from Vercel.

---

## Part 1: Access Your DNS Settings

1. **Log into GoDaddy:**
   - Go to: https://www.godaddy.com
   - Click "Sign In" in the top right
   - Enter your username and password

2. **Go to My Products:**
   - After logging in, click "My Products" in the top menu
   - You should see "huddlebooks.ca" in your domain list

3. **Open DNS Management:**
   - Find "huddlebooks.ca" in the list
   - Click the "DNS" button next to it
   - This will open the DNS Management page

---

## Part 2: Add Vercel DNS Records

These records will make www.huddlebooks.ca point to your Vercel site.

### Step 1: Add CNAME Record for www

1. **Scroll down to "Records"**
   - You'll see a table with existing DNS records
   - Click "Add" button (usually in the top right of the records table)

2. **Add CNAME Record:**
   - **Type:** Select "CNAME" from dropdown
   - **Name:** `www`
   - **Value:** `cname.vercel-dns.com`
   - **TTL:** `1 hour` (or leave default)
   - Click "Save"

### Step 2: Add A Record for Root Domain

1. **Click "Add" again**

2. **Add A Record:**
   - **Type:** Select "A" from dropdown
   - **Name:** `@` (this means the root domain, huddlebooks.ca)
   - **Value:** `76.76.21.21`
   - **TTL:** `1 hour` (or leave default)
   - Click "Save"

**Note:** If there's already an A record with name "@", you'll need to:

- Click the pencil icon to edit it
- Change the Value to `76.76.21.21`
- Save

---

## Part 3: Add Resend DNS Records (For Sending Emails)

These records verify you own the domain so Resend can send emails on your behalf.

**Where to find these records:**

1. Go to Resend: https://resend.com
2. Log in
3. Click "Domains" in the sidebar
4. Click on "huddlebooks.ca"
5. You'll see 3 DNS records to add (SPF, DKIM, and DMARC)

### Step 1: Add SPF Record

1. **In GoDaddy DNS, click "Add"**

2. **Add TXT Record:**
   - **Type:** Select "TXT" from dropdown
   - **Name:** `@`
   - **Value:** Copy from Resend - it will look like: `v=spf1 include:resend.com ~all`
   - **TTL:** `1 hour`
   - Click "Save"

### Step 2: Add DKIM Record

1. **Click "Add" again**

2. **Add TXT Record:**
   - **Type:** Select "TXT" from dropdown
   - **Name:** Copy from Resend - it will look like: `resend._domainkey`
   - **Value:** Copy from Resend - it will be a long string starting with `p=`
   - **TTL:** `1 hour`
   - Click "Save"

### Step 3: Add DMARC Record

1. **Click "Add" again**

2. **Add TXT Record:**
   - **Type:** Select "TXT" from dropdown
   - **Name:** `_dmarc`
   - **Value:** Copy from Resend - it will look like: `v=DMARC1; p=none; rua=mailto:mike@huddlebooks.ca`
   - **TTL:** `1 hour`
   - Click "Save"

---

## Part 4: Add Zoho Mail DNS Records (For Receiving Emails)

These records will be added AFTER you set up Zoho Mail (see Zoho Mail Setup Guide). You'll come back to this section.

When you're ready, you'll add these records (Zoho will provide the exact values):

### MX Records (Mail Exchange)

1. **Click "Add"**
2. **Add MX Record:**
   - **Type:** MX
   - **Name:** `@`
   - **Value:** `mx.zoho.com` (priority: 10)
   - **Priority:** `10`
   - **TTL:** `1 hour`
   - Click "Save"

3. **Add backup MX record:**
   - **Type:** MX
   - **Name:** `@`
   - **Value:** `mx2.zoho.com` (priority: 20)
   - **Priority:** `20`
   - **TTL:** `1 hour`
   - Click "Save"

### TXT Record for Zoho Verification

1. **Click "Add"**
2. **Add TXT Record:**
   - **Type:** TXT
   - **Name:** `@`
   - **Value:** Zoho will give you this - it will look like: `zoho-verification=xxxxxxxxxxxxx.zmverify.zoho.com`
   - **TTL:** `1 hour`
   - Click "Save"

### SPF Record for Zoho (Update existing)

If you already added the Resend SPF record, you'll need to update it to include both Resend and Zoho:

1. **Find the existing TXT record with name "@" and value starting with "v=spf1"**
2. **Click the pencil icon to edit**
3. **Change the value to:**
   ```
   v=spf1 include:resend.com include:zoho.com ~all
   ```
4. **Click "Save"**

---

## Part 5: Verify Everything Works

### Check DNS Propagation

DNS changes can take 24-48 hours to fully propagate, but often work within a few hours.

1. **Check if www.huddlebooks.ca works:**
   - Open a private/incognito browser window
   - Go to: https://www.huddlebooks.ca
   - You should see your landing page
   - If not, wait a few hours and try again

2. **Check DNS records:**
   - Use this tool: https://dnschecker.org
   - Enter: `www.huddlebooks.ca`
   - Select "CNAME" record type
   - Click "Search"
   - You should see "cname.vercel-dns.com" in the results

### Verify Resend Domain

1. **Go back to Resend:** https://resend.com
2. **Click "Domains" > "huddlebooks.ca"**
3. **Click "Verify DNS Records"**
4. **If verified, you'll see green checkmarks**
5. **If not verified yet, wait a few hours and try again**

### Test Email Sending (After DNS Propagates)

1. **Go to your live site:** https://www.huddlebooks.ca
2. **Scroll to "Get Updates" section**
3. **Enter a test email and click "Get Notified"**
4. **Check your inbox - you should receive a confirmation email**

---

## Summary of All DNS Records

Here's a complete list of what you should have when done:

| Type  | Name               | Value/Data                                      | Priority |
| ----- | ------------------ | ----------------------------------------------- | -------- |
| A     | @                  | 76.76.21.21                                     | -        |
| CNAME | www                | cname.vercel-dns.com                            | -        |
| TXT   | @                  | v=spf1 include:resend.com include:zoho.com ~all | -        |
| TXT   | resend.\_domainkey | p=MIGfMA0GCS... (long string from Resend)       | -        |
| TXT   | \_dmarc            | v=DMARC1; p=none; rua=mailto:mike@...           | -        |
| TXT   | @                  | zoho-verification=xxxxx.zmverify.zoho.com       | -        |
| MX    | @                  | mx.zoho.com                                     | 10       |
| MX    | @                  | mx2.zoho.com                                    | 20       |

---

## Troubleshooting

### "This site can't be reached" when visiting www.huddlebooks.ca

- **Solution:** DNS hasn't propagated yet. Wait 2-24 hours and try again.

### Resend shows "DNS records not verified"

- **Solution:** Wait 2-4 hours after adding records, then click "Verify DNS Records" again.

### Emails aren't being sent

- **Check 1:** Is Resend domain verified? (green checkmarks in Resend dashboard)
- **Check 2:** Did you add the RESEND_API_KEY environment variable in Vercel?
- **Check 3:** Check Vercel logs for errors (Vercel dashboard > Project > Deployments > Logs)

### Can't add TXT record (says duplicate)

- **Solution:** You might already have a TXT record for "@". Click edit and update it instead.

---

## Next Steps

✅ DNS is configured!

Now continue with:

- **Zoho Mail Setup Guide** (to create your email addresses)
