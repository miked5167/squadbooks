import { Resend } from 'resend'

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY)

// Email configuration
const FROM_EMAIL = 'Squadbooks <noreply@squadbooks.com>' // Update with your verified domain
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

export interface ApprovalEmailData {
  approverName: string
  approverEmail: string
  treasurerName: string
  teamName: string
  transactionType: 'EXPENSE' | 'INCOME'
  amount: number
  vendor: string
  description?: string
  categoryName: string
  transactionDate: string
  transactionId: string
  approvalId: string
}

/**
 * Send approval request email to Assistant Treasurer
 */
export async function sendApprovalRequestEmail(data: ApprovalEmailData) {
  const {
    approverName,
    approverEmail,
    treasurerName,
    teamName,
    transactionType,
    amount,
    vendor,
    description,
    categoryName,
    transactionDate,
    transactionId,
    approvalId,
  } = data

  const approveUrl = `${APP_URL}/approvals?highlight=${approvalId}`
  const viewUrl = `${APP_URL}/transactions/${transactionId}`

  const subject = `Approval Required: $${amount.toLocaleString()} ${transactionType.toLowerCase()} - ${vendor}`

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Approval Required</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">

  <!-- Header -->
  <div style="background: linear-gradient(135deg, #1e3a5f 0%, #2d5a7b 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; text-align: center;">
    <h1 style="margin: 0; font-size: 24px; font-weight: 600;">Approval Required</h1>
    <p style="margin: 10px 0 0; opacity: 0.9; font-size: 14px;">${teamName}</p>
  </div>

  <!-- Content -->
  <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">

    <p style="margin: 0 0 20px; font-size: 16px;">Hi ${approverName},</p>

    <p style="margin: 0 0 20px; font-size: 16px;">
      <strong>${treasurerName}</strong> has created a new ${transactionType.toLowerCase()} that requires your approval.
    </p>

    <!-- Transaction Details Card -->
    <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 20px 0;">

      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; padding-bottom: 15px; border-bottom: 2px solid #e5e7eb;">
        <span style="font-size: 14px; color: #6b7280; font-weight: 500;">AMOUNT</span>
        <span style="font-size: 24px; font-weight: 700; color: ${transactionType === 'EXPENSE' ? '#dc2626' : '#059669'};">
          $${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
      </div>

      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px; width: 40%;">Type:</td>
          <td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 500;">${transactionType}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">${transactionType === 'EXPENSE' ? 'Vendor:' : 'Source:'}</td>
          <td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 500;">${vendor}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Category:</td>
          <td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 500;">${categoryName}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Date:</td>
          <td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 500;">${new Date(transactionDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
        </tr>
        ${description ? `
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px; vertical-align: top;">Description:</td>
          <td style="padding: 8px 0; color: #111827; font-size: 14px;">${description}</td>
        </tr>
        ` : ''}
      </table>

    </div>

    <!-- Action Buttons -->
    <div style="text-align: center; margin: 30px 0 20px;">
      <a href="${approveUrl}" style="display: inline-block; background: #059669; color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px; margin: 0 5px;">
        Review & Approve
      </a>
      <a href="${viewUrl}" style="display: inline-block; background: #6b7280; color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px; margin: 0 5px;">
        View Details
      </a>
    </div>

    <p style="margin: 20px 0 0; font-size: 14px; color: #6b7280; text-align: center;">
      Please review and take action on this request at your earliest convenience.
    </p>

  </div>

  <!-- Footer -->
  <div style="text-align: center; margin-top: 20px; padding: 20px; color: #9ca3af; font-size: 12px;">
    <p style="margin: 0 0 5px;">This is an automated notification from Squadbooks</p>
    <p style="margin: 0;">© ${new Date().getFullYear()} Squadbooks. All rights reserved.</p>
  </div>

</body>
</html>
`

  const textContent = `
Approval Required - ${teamName}

Hi ${approverName},

${treasurerName} has created a new ${transactionType.toLowerCase()} that requires your approval.

Transaction Details:
-------------------
Amount: $${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
Type: ${transactionType}
${transactionType === 'EXPENSE' ? 'Vendor' : 'Source'}: ${vendor}
Category: ${categoryName}
Date: ${new Date(transactionDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
${description ? `Description: ${description}` : ''}

Review and approve: ${approveUrl}
View full details: ${viewUrl}

Please review and take action on this request at your earliest convenience.

---
This is an automated notification from Squadbooks
© ${new Date().getFullYear()} Squadbooks. All rights reserved.
`

  try {
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: approverEmail,
      subject,
      html: htmlContent,
      text: textContent,
    })

    console.log('Approval email sent successfully:', result)
    return { success: true, result }
  } catch (error) {
    console.error('Failed to send approval email:', error)
    throw new Error('Failed to send approval email')
  }
}

/**
 * Send approval status update email to the transaction creator
 */
export async function sendApprovalStatusEmail(
  creatorName: string,
  creatorEmail: string,
  approved: boolean,
  amount: number,
  vendor: string,
  approverName: string,
  comment?: string
) {
  const subject = `${approved ? 'Approved' : 'Rejected'}: $${amount.toLocaleString()} - ${vendor}`

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${approved ? 'Transaction Approved' : 'Transaction Rejected'}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">

  <!-- Header -->
  <div style="background: ${approved ? 'linear-gradient(135deg, #059669 0%, #10b981 100%)' : 'linear-gradient(135deg, #dc2626 0%, #ef4444 100%)'}; color: white; padding: 30px; border-radius: 8px 8px 0 0; text-align: center;">
    <h1 style="margin: 0; font-size: 24px; font-weight: 600;">${approved ? '✓ Transaction Approved' : '✗ Transaction Rejected'}</h1>
  </div>

  <!-- Content -->
  <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">

    <p style="margin: 0 0 20px; font-size: 16px;">Hi ${creatorName},</p>

    <p style="margin: 0 0 20px; font-size: 16px;">
      <strong>${approverName}</strong> has ${approved ? 'approved' : 'rejected'} your transaction:
    </p>

    <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 20px 0;">
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px; width: 30%;">Amount:</td>
          <td style="padding: 8px 0; color: #111827; font-size: 16px; font-weight: 700;">$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Vendor:</td>
          <td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 500;">${vendor}</td>
        </tr>
        ${comment ? `
        <tr>
          <td style="padding: 16px 0 8px; color: #6b7280; font-size: 14px; vertical-align: top; border-top: 1px solid #e5e7eb;">Comment:</td>
          <td style="padding: 16px 0 8px; color: #111827; font-size: 14px; border-top: 1px solid #e5e7eb;">${comment}</td>
        </tr>
        ` : ''}
      </table>
    </div>

    ${approved
      ? '<p style="margin: 20px 0 0; font-size: 14px; color: #6b7280;">Your transaction has been approved and is now reflected in your team budget.</p>'
      : '<p style="margin: 20px 0 0; font-size: 14px; color: #6b7280;">If you have questions about this decision, please contact your Assistant Treasurer.</p>'
    }

  </div>

  <!-- Footer -->
  <div style="text-align: center; margin-top: 20px; padding: 20px; color: #9ca3af; font-size: 12px;">
    <p style="margin: 0 0 5px;">This is an automated notification from Squadbooks</p>
    <p style="margin: 0;">© ${new Date().getFullYear()} Squadbooks. All rights reserved.</p>
  </div>

</body>
</html>
`

  const textContent = `
${approved ? 'Transaction Approved' : 'Transaction Rejected'}

Hi ${creatorName},

${approverName} has ${approved ? 'approved' : 'rejected'} your transaction:

Amount: $${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
Vendor: ${vendor}
${comment ? `Comment: ${comment}` : ''}

${approved
  ? 'Your transaction has been approved and is now reflected in your team budget.'
  : 'If you have questions about this decision, please contact your Assistant Treasurer.'
}

---
This is an automated notification from Squadbooks
© ${new Date().getFullYear()} Squadbooks. All rights reserved.
`

  try {
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: creatorEmail,
      subject,
      html: htmlContent,
      text: textContent,
    })

    console.log('Status update email sent successfully:', result)
    return { success: true, result }
  } catch (error) {
    console.error('Failed to send status update email:', error)
    // Don't throw - we don't want to fail the approval/rejection just because email failed
    return { success: false, error }
  }
}

export interface ParentInviteEmailData {
  parentEmail: string
  parentName?: string
  playerFirstName: string
  playerLastName: string
  teamName: string
  season: string
  inviteToken: string
  expiresAt: Date
  teamLogoUrl?: string
  associationName?: string
}

/**
 * Send parent onboarding invitation email
 */
export async function sendParentInviteEmail(data: ParentInviteEmailData) {
  const {
    parentEmail,
    parentName,
    playerFirstName,
    playerLastName,
    teamName,
    season,
    inviteToken,
    expiresAt,
    teamLogoUrl,
    associationName,
  } = data

  const onboardingUrl = `${APP_URL}/parent-onboarding?token=${inviteToken}`
  const expiryDate = expiresAt.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })

  const subject = `Complete Your Player Information for ${playerFirstName} ${playerLastName} - ${teamName}`

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Parent Onboarding Invitation</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">

  <!-- Header -->
  <div style="background: linear-gradient(135deg, #1e3a5f 0%, #2d5a7b 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; text-align: center;">
    ${teamLogoUrl ? `<img src="${teamLogoUrl}" alt="${teamName}" style="max-width: 80px; max-height: 80px; margin-bottom: 15px; border-radius: 8px;">` : ''}
    <h1 style="margin: 0; font-size: 24px; font-weight: 600;">Welcome to ${teamName}</h1>
    <p style="margin: 10px 0 0; opacity: 0.9; font-size: 14px;">${season} Season${associationName ? ` • ${associationName}` : ''}</p>
  </div>

  <!-- Content -->
  <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">

    <p style="margin: 0 0 20px; font-size: 16px;">Hi ${parentName || 'there'},</p>

    <p style="margin: 0 0 20px; font-size: 16px;">
      We're excited to have <strong>${playerFirstName} ${playerLastName}</strong> on our team! To complete the registration process, please provide your family information and emergency contact details.
    </p>

    <!-- Info Card -->
    <div style="background: #eff6ff; border-left: 4px solid #3b82f6; padding: 16px 20px; margin: 20px 0; border-radius: 4px;">
      <p style="margin: 0; font-size: 14px; color: #1e40af; font-weight: 500;">
        <strong>Why we need this:</strong>
      </p>
      <ul style="margin: 8px 0 0; padding-left: 20px; font-size: 14px; color: #1e40af;">
        <li>Emergency contact information for player safety</li>
        <li>Medical information and allergies</li>
        <li>Family contact details for team communication</li>
      </ul>
    </div>

    <p style="margin: 20px 0; font-size: 16px;">
      This should only take a few minutes to complete. Your information is kept secure and will only be used for team management purposes.
    </p>

    <!-- Action Button -->
    <div style="text-align: center; margin: 30px 0;">
      <a href="${onboardingUrl}" style="display: inline-block; background: #2563eb; color: white; padding: 16px 40px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(37, 99, 235, 0.2);">
        Complete Your Information
      </a>
    </div>

    <!-- Expiry Notice -->
    <div style="background: #fef3c7; border: 1px solid #fbbf24; border-radius: 6px; padding: 12px 16px; margin: 20px 0;">
      <p style="margin: 0; font-size: 13px; color: #92400e;">
        <strong>⏰ This invitation expires on ${expiryDate}</strong>
      </p>
    </div>

    <p style="margin: 20px 0 0; font-size: 14px; color: #6b7280;">
      If you have any questions or issues accessing the form, please contact your team administrator.
    </p>

    <p style="margin: 16px 0 0; font-size: 14px; color: #6b7280;">
      If the button above doesn't work, copy and paste this link into your browser:<br>
      <span style="color: #2563eb; word-break: break-all;">${onboardingUrl}</span>
    </p>

  </div>

  <!-- Footer -->
  <div style="text-align: center; margin-top: 20px; padding: 20px; color: #9ca3af; font-size: 12px;">
    <p style="margin: 0 0 5px;">This is an automated invitation from Squadbooks</p>
    <p style="margin: 0;">© ${new Date().getFullYear()} Squadbooks. All rights reserved.</p>
  </div>

</body>
</html>
`

  const textContent = `
Welcome to ${teamName} - ${season} Season
${associationName ? `${associationName}\n` : ''}

Hi ${parentName || 'there'},

We're excited to have ${playerFirstName} ${playerLastName} on our team! To complete the registration process, please provide your family information and emergency contact details.

Why we need this:
• Emergency contact information for player safety
• Medical information and allergies
• Family contact details for team communication

This should only take a few minutes to complete. Your information is kept secure and will only be used for team management purposes.

Complete your information here:
${onboardingUrl}

IMPORTANT: This invitation expires on ${expiryDate}

If you have any questions or issues accessing the form, please contact your team administrator.

---
This is an automated invitation from Squadbooks
© ${new Date().getFullYear()} Squadbooks. All rights reserved.
`

  try {
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: parentEmail,
      subject,
      html: htmlContent,
      text: textContent,
    })

    console.log('Parent invite email sent successfully:', result)
    return { success: true, result }
  } catch (error) {
    console.error('Failed to send parent invite email:', error)
    throw new Error('Failed to send parent invite email')
  }
}

export interface BudgetApprovalEmailData {
  parentName: string
  parentEmail: string
  teamName: string
  budgetTotal: number
  approvalType: 'INITIAL' | 'REVISION' | 'REPORT'
  description?: string
  deadline?: Date
  approvalId: string
}

/**
 * Send budget approval request email to parents
 */
export async function sendBudgetApprovalRequestEmail(data: BudgetApprovalEmailData) {
  const {
    parentName,
    parentEmail,
    teamName,
    budgetTotal,
    approvalType,
    description,
    deadline,
    approvalId,
  } = data

  const acknowledgeUrl = `${APP_URL}/budget-approvals/${approvalId}`

  const typeLabel = {
    INITIAL: 'Initial Budget',
    REVISION: 'Budget Revision',
    REPORT: 'Budget Report'
  }[approvalType]

  const subject = `Budget Acknowledgment Required - ${teamName}`

  const deadlineText = deadline
    ? deadline.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : null

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Budget Acknowledgment Required</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">

  <!-- Header -->
  <div style="background: linear-gradient(135deg, #7c3aed 0%, #9333ea 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; text-align: center;">
    <h1 style="margin: 0; font-size: 24px; font-weight: 600;">Budget Acknowledgment Required</h1>
    <p style="margin: 10px 0 0; opacity: 0.9; font-size: 14px;">${teamName}</p>
  </div>

  <!-- Content -->
  <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">

    <p style="margin: 0 0 20px; font-size: 16px;">Hi ${parentName},</p>

    <p style="margin: 0 0 20px; font-size: 16px;">
      Your team treasurer has submitted a <strong>${typeLabel}</strong> that requires acknowledgment from all parents.
    </p>

    <!-- Budget Details Card -->
    <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 20px 0;">

      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; padding-bottom: 15px; border-bottom: 2px solid #e5e7eb;">
        <span style="font-size: 14px; color: #6b7280; font-weight: 500;">TOTAL BUDGET</span>
        <span style="font-size: 24px; font-weight: 700; color: #7c3aed;">
          $${budgetTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
      </div>

      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px; width: 35%;">Type:</td>
          <td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 500;">${typeLabel}</td>
        </tr>
        ${description ? `
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px; vertical-align: top;">Description:</td>
          <td style="padding: 8px 0; color: #111827; font-size: 14px;">${description}</td>
        </tr>
        ` : ''}
        ${deadlineText ? `
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Deadline:</td>
          <td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 500;">${deadlineText}</td>
        </tr>
        ` : ''}
      </table>

    </div>

    <!-- Info Card -->
    <div style="background: #eff6ff; border-left: 4px solid #3b82f6; padding: 16px 20px; margin: 20px 0; border-radius: 4px;">
      <p style="margin: 0; font-size: 14px; color: #1e40af; font-weight: 500;">
        <strong>What does this mean?</strong>
      </p>
      <p style="margin: 8px 0 0; font-size: 14px; color: #1e40af;">
        This is for your awareness and acknowledgment. By acknowledging, you confirm that you've reviewed the budget information for your team.
      </p>
    </div>

    <!-- Action Button -->
    <div style="text-align: center; margin: 30px 0 20px;">
      <a href="${acknowledgeUrl}" style="display: inline-block; background: #7c3aed; color: white; padding: 16px 40px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(124, 58, 237, 0.2);">
        Review & Acknowledge Budget
      </a>
    </div>

    ${deadlineText ? `
    <div style="background: #fef3c7; border: 1px solid #fbbf24; border-radius: 6px; padding: 12px 16px; margin: 20px 0;">
      <p style="margin: 0; font-size: 13px; color: #92400e;">
        <strong>⏰ Please acknowledge by ${deadlineText}</strong>
      </p>
    </div>
    ` : ''}

    <p style="margin: 20px 0 0; font-size: 14px; color: #6b7280; text-align: center;">
      Please review and acknowledge this budget at your earliest convenience.
    </p>

  </div>

  <!-- Footer -->
  <div style="text-align: center; margin-top: 20px; padding: 20px; color: #9ca3af; font-size: 12px;">
    <p style="margin: 0 0 5px;">This is an automated notification from Squadbooks</p>
    <p style="margin: 0;">© ${new Date().getFullYear()} Squadbooks. All rights reserved.</p>
  </div>

</body>
</html>
`

  const textContent = `
Budget Acknowledgment Required - ${teamName}

Hi ${parentName},

Your team treasurer has submitted a ${typeLabel} that requires acknowledgment from all parents.

Budget Details:
--------------
Total Budget: $${budgetTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
Type: ${typeLabel}
${description ? `Description: ${description}` : ''}
${deadlineText ? `Deadline: ${deadlineText}` : ''}

What does this mean?
This is for your awareness and acknowledgment. By acknowledging, you confirm that you've reviewed the budget information for your team.

Review and acknowledge: ${acknowledgeUrl}

Please review and acknowledge this budget at your earliest convenience.

---
This is an automated notification from Squadbooks
© ${new Date().getFullYear()} Squadbooks. All rights reserved.
`

  try {
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: parentEmail,
      subject,
      html: htmlContent,
      text: textContent,
    })

    console.log('Budget approval request email sent successfully:', result)
    return { success: true, result }
  } catch (error) {
    console.error('Failed to send budget approval request email:', error)
    // Don't throw - we don't want to fail the approval creation just because email failed
    return { success: false, error }
  }
}

export interface BudgetCompletionEmailData {
  treasurerName: string
  treasurerEmail: string
  teamName: string
  budgetTotal: number
  approvalType: 'INITIAL' | 'REVISION' | 'REPORT'
  acknowledgedCount: number
  requiredCount: number
}

/**
 * Send budget approval completion notification to treasurer
 */
export async function sendBudgetApprovalCompletionEmail(data: BudgetCompletionEmailData) {
  const {
    treasurerName,
    treasurerEmail,
    teamName,
    budgetTotal,
    approvalType,
    acknowledgedCount,
    requiredCount,
  } = data

  const budgetUrl = `${APP_URL}/budget/approvals`

  const typeLabel = {
    INITIAL: 'Initial Budget',
    REVISION: 'Budget Revision',
    REPORT: 'Budget Report'
  }[approvalType]

  const subject = `Budget Approval Completed - ${teamName}`

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Budget Approval Completed</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">

  <!-- Header -->
  <div style="background: linear-gradient(135deg, #059669 0%, #10b981 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; text-align: center;">
    <h1 style="margin: 0; font-size: 24px; font-weight: 600;">✓ Budget Approval Completed</h1>
    <p style="margin: 10px 0 0; opacity: 0.9; font-size: 14px;">${teamName}</p>
  </div>

  <!-- Content -->
  <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">

    <p style="margin: 0 0 20px; font-size: 16px;">Hi ${treasurerName},</p>

    <p style="margin: 0 0 20px; font-size: 16px;">
      Great news! All parents have acknowledged your <strong>${typeLabel}</strong>.
    </p>

    <!-- Completion Details Card -->
    <div style="background: #f0fdf4; border: 1px solid #86efac; border-radius: 8px; padding: 20px; margin: 20px 0;">

      <div style="text-align: center; margin-bottom: 20px;">
        <div style="font-size: 48px; font-weight: 700; color: #059669;">
          ${acknowledgedCount}/${requiredCount}
        </div>
        <div style="font-size: 14px; color: #047857; font-weight: 500; margin-top: 5px;">
          Parents Acknowledged
        </div>
      </div>

      <table style="width: 100%; border-collapse: collapse; border-top: 2px solid #86efac; padding-top: 15px;">
        <tr>
          <td style="padding: 8px 0; color: #047857; font-size: 14px; width: 40%;">Budget Total:</td>
          <td style="padding: 8px 0; color: #065f46; font-size: 16px; font-weight: 700;">$${budgetTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #047857; font-size: 14px;">Approval Type:</td>
          <td style="padding: 8px 0; color: #065f46; font-size: 14px; font-weight: 500;">${typeLabel}</td>
        </tr>
      </table>

    </div>

    <!-- Success Message -->
    <div style="background: #eff6ff; border-left: 4px solid #3b82f6; padding: 16px 20px; margin: 20px 0; border-radius: 4px;">
      <p style="margin: 0; font-size: 14px; color: #1e40af;">
        <strong>✓ All done!</strong> Your budget approval process is complete. All parents have been notified and have acknowledged the budget information.
      </p>
    </div>

    <!-- Action Button -->
    <div style="text-align: center; margin: 30px 0 20px;">
      <a href="${budgetUrl}" style="display: inline-block; background: #059669; color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
        View Budget Approvals
      </a>
    </div>

    <p style="margin: 20px 0 0; font-size: 14px; color: #6b7280; text-align: center;">
      You can view all approval details in your budget dashboard.
    </p>

  </div>

  <!-- Footer -->
  <div style="text-align: center; margin-top: 20px; padding: 20px; color: #9ca3af; font-size: 12px;">
    <p style="margin: 0 0 5px;">This is an automated notification from Squadbooks</p>
    <p style="margin: 0;">© ${new Date().getFullYear()} Squadbooks. All rights reserved.</p>
  </div>

</body>
</html>
`

  const textContent = `
Budget Approval Completed - ${teamName}

Hi ${treasurerName},

Great news! All parents have acknowledged your ${typeLabel}.

Completion Summary:
------------------
Parents Acknowledged: ${acknowledgedCount}/${requiredCount}
Budget Total: $${budgetTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
Approval Type: ${typeLabel}

All done! Your budget approval process is complete. All parents have been notified and have acknowledged the budget information.

View budget approvals: ${budgetUrl}

You can view all approval details in your budget dashboard.

---
This is an automated notification from Squadbooks
© ${new Date().getFullYear()} Squadbooks. All rights reserved.
`

  try {
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: treasurerEmail,
      subject,
      html: htmlContent,
      text: textContent,
    })

    console.log('Budget completion email sent successfully:', result)
    return { success: true, result }
  } catch (error) {
    console.error('Failed to send budget completion email:', error)
    // Don't throw - we don't want to fail the acknowledgment just because email failed
    return { success: false, error }
  }
}
