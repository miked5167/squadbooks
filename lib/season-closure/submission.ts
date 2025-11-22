import { prisma } from '@/lib/prisma';
import { supabase } from '@/lib/storage';
import { Resend } from 'resend';
import { generateSeasonPackage } from './package-generator';
import { createSeasonPackageZip } from './zip-creator';
import { DEFAULT_POLICY } from './validation';

const resend = new Resend(process.env.RESEND_API_KEY);
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const SEASON_PACKAGES_BUCKET = 'season-packages';

/**
 * Submit season closure package to the association
 * This function:
 * 1. Generates all reports and receipts
 * 2. Creates a ZIP archive
 * 3. Uploads to Supabase Storage
 * 4. Sends email with ZIP attached and download link
 * 5. Updates SeasonClosure record
 * 6. Creates audit log entry
 */
export async function submitToAssociation(seasonClosureId: string): Promise<void> {
  // Load SeasonClosure with relations
  const closure = await prisma.seasonClosure.findUnique({
    where: { id: seasonClosureId },
    include: {
      team: true,
      submitter: true,
    },
  });

  if (!closure) {
    throw new Error('Season closure not found');
  }

  if (!closure.associationEmail) {
    throw new Error('Association email is required');
  }

  try {
    // Update status to VALIDATING
    await prisma.seasonClosure.update({
      where: { id: seasonClosureId },
      data: { status: 'VALIDATING' },
    });

    // Generate the complete season package
    console.log('Generating season package...');
    const pkg = await generateSeasonPackage(closure.teamId, closure.season);

    // Create ZIP archive
    console.log('Creating ZIP archive...');
    const zipBuffer = await createSeasonPackageZip(pkg, closure.team.name, closure.season);

    // Upload ZIP to Supabase Storage
    console.log('Uploading to storage...');
    const fileName = `${closure.team.name.replace(/[^a-z0-9]/gi, '_')}_${closure.season.replace(/[^a-z0-9]/gi, '_')}_Package.zip`;
    const filePath = `${closure.teamId}/${closure.season}/package.zip`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(SEASON_PACKAGES_BUCKET)
      .upload(filePath, zipBuffer, {
        contentType: 'application/zip',
        cacheControl: '3600',
        upsert: true,
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      throw new Error(`Failed to upload package: ${uploadError.message}`);
    }

    // Generate a signed URL (valid for 30 days)
    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from(SEASON_PACKAGES_BUCKET)
      .createSignedUrl(filePath, 30 * 24 * 60 * 60); // 30 days

    if (signedUrlError) {
      console.error('Signed URL error:', signedUrlError);
      throw new Error(`Failed to generate download URL: ${signedUrlError.message}`);
    }

    const downloadUrl = signedUrlData.signedUrl;

    // Send email with ZIP attached and download link
    console.log('Sending email...');
    await sendSeasonClosureEmail({
      to: closure.associationEmail,
      cc: closure.submitter?.email,
      teamName: closure.team.name,
      season: closure.season,
      submitterName: closure.submitter?.name || 'Team Treasurer',
      summary: pkg.summary,
      downloadUrl,
      zipBuffer,
      fileName,
    });

    // Update SeasonClosure record
    await prisma.seasonClosure.update({
      where: { id: seasonClosureId },
      data: {
        status: 'SUBMITTED',
        submittedAt: new Date(),
        packageUrl: downloadUrl,
        // Snapshot financial summary
        totalIncome: pkg.summary.totalIncome,
        totalExpenses: pkg.summary.totalExpenses,
        finalBalance: pkg.summary.finalBalance,
      },
    });

    // Create audit log entry
    await prisma.auditLog.create({
      data: {
        teamId: closure.teamId,
        userId: closure.submittedBy!,
        action: 'SUBMIT_SEASON_CLOSURE',
        entityType: 'SeasonClosure',
        entityId: seasonClosureId,
        newValues: {
          status: 'SUBMITTED',
          packageUrl: downloadUrl,
          associationEmail: closure.associationEmail,
          totalIncome: pkg.summary.totalIncome,
          totalExpenses: pkg.summary.totalExpenses,
          finalBalance: pkg.summary.finalBalance,
        },
      },
    });

    console.log('Season closure submitted successfully');
  } catch (error) {
    // If anything fails, update status back to READY
    await prisma.seasonClosure.update({
      where: { id: seasonClosureId },
      data: { status: 'READY' },
    });

    throw error;
  }
}

/**
 * Send season closure email to association
 */
async function sendSeasonClosureEmail(params: {
  to: string;
  cc?: string;
  teamName: string;
  season: string;
  submitterName: string;
  summary: {
    totalIncome: number;
    totalExpenses: number;
    finalBalance: number;
    transactionCount: number;
    receiptCount: number;
  };
  downloadUrl: string;
  zipBuffer: Buffer;
  fileName: string;
}): Promise<void> {
  const { to, cc, teamName, season, submitterName, summary, downloadUrl, zipBuffer, fileName } =
    params;

  const subject = `Season Closure Package - ${teamName} (${season})`;

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Season Closure Package</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">

  <!-- Header -->
  <div style="background: linear-gradient(135deg, #1e3a5f 0%, #2d5a7b 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; text-align: center;">
    <h1 style="margin: 0; font-size: 24px; font-weight: 600;">Season Closure Package</h1>
    <p style="margin: 10px 0 0; opacity: 0.9; font-size: 14px;">${teamName}</p>
  </div>

  <!-- Content -->
  <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">

    <p style="margin: 0 0 20px; font-size: 16px;">Dear Association,</p>

    <p style="margin: 0 0 20px; font-size: 16px;">
      Please find attached the complete financial package for <strong>${teamName}</strong> - <strong>${season}</strong> season.
    </p>

    <p style="margin: 0 0 20px; font-size: 16px;">
      This package has been prepared and submitted by <strong>${submitterName}</strong> on ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}.
    </p>

    <!-- Financial Summary Card -->
    <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 20px 0;">
      <h2 style="margin: 0 0 15px; font-size: 18px; color: #111827;">Financial Summary</h2>

      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px; width: 50%;">Total Income:</td>
          <td style="padding: 8px 0; color: #059669; font-size: 16px; font-weight: 700; text-align: right;">$${summary.totalIncome.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Total Expenses:</td>
          <td style="padding: 8px 0; color: #dc2626; font-size: 16px; font-weight: 700; text-align: right;">$${summary.totalExpenses.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
        </tr>
        <tr style="border-top: 2px solid #e5e7eb;">
          <td style="padding: 12px 0 8px; color: #111827; font-size: 16px; font-weight: 600;">Final Balance:</td>
          <td style="padding: 12px 0 8px; color: #111827; font-size: 18px; font-weight: 700; text-align: right;">$${summary.finalBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
        </tr>
      </table>

      <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #e5e7eb;">
        <p style="margin: 0; font-size: 14px; color: #6b7280;">
          <strong>${summary.transactionCount}</strong> transactions | <strong>${summary.receiptCount}</strong> receipts included
        </p>
      </div>
    </div>

    <!-- Package Contents -->
    <div style="background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 8px; padding: 20px; margin: 20px 0;">
      <h3 style="margin: 0 0 15px; font-size: 16px; color: #0369a1;">Package Contents</h3>

      <ul style="margin: 0; padding-left: 20px; color: #0c4a6e; font-size: 14px; line-height: 1.8;">
        <li>Final Budget Report (PDF)</li>
        <li>Complete Transaction History (PDF)</li>
        <li>Budget Variance Analysis (PDF)</li>
        <li>Audit Trail Report (PDF)</li>
        <li>All ${summary.receiptCount} Receipt Files</li>
        <li>README with Summary and Contents</li>
      </ul>
    </div>

    <!-- Download Button -->
    <div style="text-align: center; margin: 30px 0;">
      <a href="${downloadUrl}" style="display: inline-block; background: #059669; color: white; padding: 16px 40px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
        Download Season Package (ZIP)
      </a>
    </div>

    <p style="margin: 20px 0 0; font-size: 13px; color: #6b7280; text-align: center;">
      The package is also attached to this email for your convenience.<br>
      Download link is valid for 30 days.
    </p>

  </div>

  <!-- Footer -->
  <div style="text-align: center; margin-top: 20px; padding: 20px; color: #9ca3af; font-size: 12px;">
    <p style="margin: 0 0 5px;">Generated by TeamTreasure</p>
    <p style="margin: 0;">© ${new Date().getFullYear()} TeamTreasure. All rights reserved.</p>
  </div>

</body>
</html>
`;

  const textContent = `
Season Closure Package - ${teamName} (${season})

Dear Association,

Please find attached the complete financial package for ${teamName} - ${season} season.

This package has been prepared and submitted by ${submitterName} on ${new Date().toLocaleDateString()}.

FINANCIAL SUMMARY
-----------------
Total Income:      $${summary.totalIncome.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
Total Expenses:    $${summary.totalExpenses.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
Final Balance:     $${summary.finalBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}

${summary.transactionCount} transactions | ${summary.receiptCount} receipts included

PACKAGE CONTENTS
----------------
• Final Budget Report (PDF)
• Complete Transaction History (PDF)
• Budget Variance Analysis (PDF)
• Audit Trail Report (PDF)
• All ${summary.receiptCount} Receipt Files
• README with Summary and Contents

Download the complete package here: ${downloadUrl}
(Link valid for 30 days)

The package is also attached to this email for your convenience.

---
Generated by TeamTreasure
© ${new Date().getFullYear()} TeamTreasure. All rights reserved.
`;

  try {
    const emailParams: any = {
      from: 'TeamTreasure <noreply@teamtreasure.com>',
      to,
      subject,
      html: htmlContent,
      text: textContent,
      attachments: [
        {
          filename: fileName,
          content: zipBuffer.toString('base64'),
        },
      ],
    };

    // Add CC if provided
    if (cc) {
      emailParams.cc = cc;
    }

    const result = await resend.emails.send(emailParams);

    console.log('Season closure email sent successfully:', result);
  } catch (error) {
    console.error('Failed to send season closure email:', error);
    throw new Error('Failed to send email');
  }
}
