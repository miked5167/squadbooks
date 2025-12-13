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
        ${
          description
            ? `
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px; vertical-align: top;">Description:</td>
          <td style="padding: 8px 0; color: #111827; font-size: 14px;">${description}</td>
        </tr>
        `
            : ''
        }
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
        ${
          comment
            ? `
        <tr>
          <td style="padding: 16px 0 8px; color: #6b7280; font-size: 14px; vertical-align: top; border-top: 1px solid #e5e7eb;">Comment:</td>
          <td style="padding: 16px 0 8px; color: #111827; font-size: 14px; border-top: 1px solid #e5e7eb;">${comment}</td>
        </tr>
        `
            : ''
        }
      </table>
    </div>

    ${
      approved
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

${
  approved
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
  const expiryDate = expiresAt.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })

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
    REPORT: 'Budget Report',
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
        ${
          description
            ? `
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px; vertical-align: top;">Description:</td>
          <td style="padding: 8px 0; color: #111827; font-size: 14px;">${description}</td>
        </tr>
        `
            : ''
        }
        ${
          deadlineText
            ? `
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Deadline:</td>
          <td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 500;">${deadlineText}</td>
        </tr>
        `
            : ''
        }
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

    ${
      deadlineText
        ? `
    <div style="background: #fef3c7; border: 1px solid #fbbf24; border-radius: 6px; padding: 12px 16px; margin: 20px 0;">
      <p style="margin: 0; font-size: 13px; color: #92400e;">
        <strong>⏰ Please acknowledge by ${deadlineText}</strong>
      </p>
    </div>
    `
        : ''
    }

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
    REPORT: 'Budget Report',
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

// ========================
// Pre-Season Budget Emails
// ========================

export interface PreSeasonBudgetSubmissionEmailData {
  adminName: string
  adminEmail: string
  coachName: string
  teamName: string
  season: string
  totalBudget: number
  perPlayerCost: number
  projectedPlayers: number
  budgetId: string
  associationName: string
}

/**
 * Send budget submission notification to association admin
 */
export async function sendPreSeasonBudgetSubmissionEmail(data: PreSeasonBudgetSubmissionEmailData) {
  const {
    adminName,
    adminEmail,
    coachName,
    teamName,
    season,
    totalBudget,
    perPlayerCost,
    projectedPlayers,
    budgetId,
    associationName,
  } = data

  const reviewUrl = `${APP_URL}/association/pre-season-budgets/${budgetId}`

  const subject = `Budget Approval Needed: ${teamName} - ${season}`

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Budget Approval Needed</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">

  <!-- Header -->
  <div style="background: linear-gradient(135deg, #1e3a5f 0%, #2d5a7b 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; text-align: center;">
    <h1 style="margin: 0; font-size: 24px; font-weight: 600;">Budget Approval Needed</h1>
    <p style="margin: 10px 0 0; opacity: 0.9; font-size: 14px;">${associationName}</p>
  </div>

  <!-- Content -->
  <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">

    <p style="margin: 0 0 20px; font-size: 16px;">Hi ${adminName},</p>

    <p style="margin: 0 0 20px; font-size: 16px;">
      <strong>${coachName}</strong> has submitted a pre-season budget proposal that requires your review and approval.
    </p>

    <!-- Budget Details Card -->
    <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 20px 0;">

      <h2 style="margin: 0 0 15px; font-size: 18px; color: #1e3a5f; font-weight: 600;">${teamName}</h2>

      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px; width: 45%;">Season:</td>
          <td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 500;">${season}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Total Budget:</td>
          <td style="padding: 8px 0; color: #111827; font-size: 16px; font-weight: 700;">$${totalBudget.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Per Player Cost:</td>
          <td style="padding: 8px 0; color: #111827; font-size: 16px; font-weight: 700;">$${perPlayerCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Projected Players:</td>
          <td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 500;">${projectedPlayers}</td>
        </tr>
      </table>

    </div>

    <!-- Info Card -->
    <div style="background: #eff6ff; border-left: 4px solid #3b82f6; padding: 16px 20px; margin: 20px 0; border-radius: 4px;">
      <p style="margin: 0; font-size: 14px; color: #1e40af; font-weight: 500;">
        <strong>Action Required:</strong>
      </p>
      <p style="margin: 8px 0 0; font-size: 14px; color: #1e40af;">
        Please review the detailed budget breakdown and either approve or reject this proposal. Once approved, the coach can share it with prospective parents.
      </p>
    </div>

    <!-- Action Buttons -->
    <div style="text-align: center; margin: 30px 0 20px;">
      <a href="${reviewUrl}" style="display: inline-block; background: #2563eb; color: white; padding: 16px 40px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(37, 99, 235, 0.2);">
        Review Budget Proposal
      </a>
    </div>

    <p style="margin: 20px 0 0; font-size: 14px; color: #6b7280; text-align: center;">
      Please review this budget at your earliest convenience.
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
Budget Approval Needed - ${associationName}

Hi ${adminName},

${coachName} has submitted a pre-season budget proposal that requires your review and approval.

Budget Details:
--------------
Team: ${teamName}
Season: ${season}
Total Budget: $${totalBudget.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
Per Player Cost: $${perPlayerCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
Projected Players: ${projectedPlayers}

Action Required:
Please review the detailed budget breakdown and either approve or reject this proposal. Once approved, the coach can share it with prospective parents.

Review budget proposal: ${reviewUrl}

Please review this budget at your earliest convenience.

---
This is an automated notification from Squadbooks
© ${new Date().getFullYear()} Squadbooks. All rights reserved.
`

  try {
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: adminEmail,
      subject,
      html: htmlContent,
      text: textContent,
    })

    console.log('Pre-season budget submission email sent successfully:', result)
    return { success: true, result }
  } catch (error) {
    console.error('Failed to send pre-season budget submission email:', error)
    return { success: false, error }
  }
}

export interface PreSeasonBudgetApprovalEmailData {
  coachName: string
  coachEmail: string
  teamName: string
  season: string
  totalBudget: number
  perPlayerCost: number
  publicSlug: string
  budgetId: string
}

/**
 * Send budget approval confirmation to coach
 */
export async function sendPreSeasonBudgetApprovalEmail(data: PreSeasonBudgetApprovalEmailData) {
  const {
    coachName,
    coachEmail,
    teamName,
    season,
    totalBudget,
    perPlayerCost,
    publicSlug,
    budgetId,
  } = data

  const publicUrl = `${APP_URL}/public-budget/${publicSlug}`
  const budgetUrl = `${APP_URL}/pre-season-budget/${budgetId}`

  const subject = `Budget Approved: ${teamName} - ${season}`

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Budget Approved</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">

  <!-- Header -->
  <div style="background: linear-gradient(135deg, #059669 0%, #10b981 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; text-align: center;">
    <h1 style="margin: 0; font-size: 24px; font-weight: 600;">✓ Budget Approved!</h1>
    <p style="margin: 10px 0 0; opacity: 0.9; font-size: 14px;">${teamName} - ${season}</p>
  </div>

  <!-- Content -->
  <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">

    <p style="margin: 0 0 20px; font-size: 16px;">Hi ${coachName},</p>

    <p style="margin: 0 0 20px; font-size: 16px;">
      Great news! Your pre-season budget proposal has been <strong>approved</strong> by your association.
    </p>

    <!-- Budget Summary Card -->
    <div style="background: #f0fdf4; border: 1px solid #86efac; border-radius: 8px; padding: 20px; margin: 20px 0;">
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; color: #047857; font-size: 14px; width: 45%;">Total Budget:</td>
          <td style="padding: 8px 0; color: #065f46; font-size: 16px; font-weight: 700;">$${totalBudget.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #047857; font-size: 14px;">Per Player Cost:</td>
          <td style="padding: 8px 0; color: #065f46; font-size: 16px; font-weight: 700;">$${perPlayerCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
        </tr>
      </table>
    </div>

    <!-- Next Steps -->
    <div style="background: #eff6ff; border-left: 4px solid #3b82f6; padding: 16px 20px; margin: 20px 0; border-radius: 4px;">
      <p style="margin: 0; font-size: 14px; color: #1e40af; font-weight: 500;">
        <strong>Next Steps:</strong>
      </p>
      <ol style="margin: 8px 0 0; padding-left: 20px; font-size: 14px; color: #1e40af;">
        <li>Share the public budget link with prospective parents</li>
        <li>Monitor parent interest submissions</li>
        <li>Once you have enough committed players, activate your team</li>
      </ol>
    </div>

    <!-- Public Budget Link -->
    <div style="background: #fef3c7; border: 1px solid #fbbf24; border-radius: 6px; padding: 16px; margin: 20px 0;">
      <p style="margin: 0 0 8px; font-size: 14px; color: #92400e; font-weight: 500;">
        📢 Share this link with parents:
      </p>
      <p style="margin: 0; font-size: 13px; color: #92400e; word-break: break-all; font-family: monospace;">
        ${publicUrl}
      </p>
    </div>

    <!-- Action Buttons -->
    <div style="text-align: center; margin: 30px 0 20px;">
      <a href="${budgetUrl}" style="display: inline-block; background: #059669; color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px; margin: 0 5px;">
        Manage Budget
      </a>
      <a href="${publicUrl}" style="display: inline-block; background: #2563eb; color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px; margin: 0 5px;">
        View Public Budget
      </a>
    </div>

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
Budget Approved! - ${teamName} - ${season}

Hi ${coachName},

Great news! Your pre-season budget proposal has been approved by your association.

Budget Summary:
--------------
Total Budget: $${totalBudget.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
Per Player Cost: $${perPlayerCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}

Next Steps:
1. Share the public budget link with prospective parents
2. Monitor parent interest submissions
3. Once you have enough committed players, activate your team

Share this link with parents:
${publicUrl}

Manage your budget: ${budgetUrl}
View public budget: ${publicUrl}

---
This is an automated notification from Squadbooks
© ${new Date().getFullYear()} Squadbooks. All rights reserved.
`

  try {
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: coachEmail,
      subject,
      html: htmlContent,
      text: textContent,
    })

    console.log('Pre-season budget approval email sent successfully:', result)
    return { success: true, result }
  } catch (error) {
    console.error('Failed to send pre-season budget approval email:', error)
    return { success: false, error }
  }
}

export interface PreSeasonBudgetRejectionEmailData {
  coachName: string
  coachEmail: string
  teamName: string
  season: string
  rejectionReason?: string
  budgetId: string
}

/**
 * Send budget rejection notification to coach
 */
export async function sendPreSeasonBudgetRejectionEmail(data: PreSeasonBudgetRejectionEmailData) {
  const { coachName, coachEmail, teamName, season, rejectionReason, budgetId } = data

  const budgetUrl = `${APP_URL}/pre-season-budget/${budgetId}`

  const subject = `Budget Revision Needed: ${teamName} - ${season}`

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Budget Revision Needed</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">

  <!-- Header -->
  <div style="background: linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; text-align: center;">
    <h1 style="margin: 0; font-size: 24px; font-weight: 600;">Budget Revision Needed</h1>
    <p style="margin: 10px 0 0; opacity: 0.9; font-size: 14px;">${teamName} - ${season}</p>
  </div>

  <!-- Content -->
  <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">

    <p style="margin: 0 0 20px; font-size: 16px;">Hi ${coachName},</p>

    <p style="margin: 0 0 20px; font-size: 16px;">
      Your association has reviewed your pre-season budget proposal and has requested some revisions before it can be approved.
    </p>

    ${
      rejectionReason
        ? `
    <!-- Feedback Card -->
    <div style="background: #fef3c7; border: 1px solid #fbbf24; border-radius: 8px; padding: 20px; margin: 20px 0;">
      <p style="margin: 0 0 8px; font-size: 14px; color: #92400e; font-weight: 500;">
        <strong>Feedback from Association:</strong>
      </p>
      <p style="margin: 0; font-size: 14px; color: #92400e;">
        ${rejectionReason}
      </p>
    </div>
    `
        : ''
    }

    <!-- Next Steps -->
    <div style="background: #eff6ff; border-left: 4px solid #3b82f6; padding: 16px 20px; margin: 20px 0; border-radius: 4px;">
      <p style="margin: 0; font-size: 14px; color: #1e40af; font-weight: 500;">
        <strong>Next Steps:</strong>
      </p>
      <ol style="margin: 8px 0 0; padding-left: 20px; font-size: 14px; color: #1e40af;">
        <li>Review the feedback provided by your association</li>
        <li>Make the necessary adjustments to your budget</li>
        <li>Resubmit for approval</li>
      </ol>
    </div>

    <!-- Action Button -->
    <div style="text-align: center; margin: 30px 0 20px;">
      <a href="${budgetUrl}" style="display: inline-block; background: #f59e0b; color: white; padding: 16px 40px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(245, 158, 11, 0.2);">
        Edit & Resubmit Budget
      </a>
    </div>

    <p style="margin: 20px 0 0; font-size: 14px; color: #6b7280; text-align: center;">
      If you have questions about the requested revisions, please contact your association administrator.
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
Budget Revision Needed - ${teamName} - ${season}

Hi ${coachName},

Your association has reviewed your pre-season budget proposal and has requested some revisions before it can be approved.

${rejectionReason ? `Feedback from Association:\n${rejectionReason}\n` : ''}
Next Steps:
1. Review the feedback provided by your association
2. Make the necessary adjustments to your budget
3. Resubmit for approval

Edit and resubmit: ${budgetUrl}

If you have questions about the requested revisions, please contact your association administrator.

---
This is an automated notification from Squadbooks
© ${new Date().getFullYear()} Squadbooks. All rights reserved.
`

  try {
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: coachEmail,
      subject,
      html: htmlContent,
      text: textContent,
    })

    console.log('Pre-season budget rejection email sent successfully:', result)
    return { success: true, result }
  } catch (error) {
    console.error('Failed to send pre-season budget rejection email:', error)
    return { success: false, error }
  }
}

export interface ParentInterestEmailData {
  coachName: string
  coachEmail: string
  teamName: string
  season: string
  parentName: string
  parentEmail: string
  parentPhone?: string
  playerName: string
  playerAge: number
  message?: string
  budgetId: string
  currentInterestCount: number
}

/**
 * Send parent interest notification to coach
 */
export async function sendParentInterestEmail(data: ParentInterestEmailData) {
  const {
    coachName,
    coachEmail,
    teamName,
    season,
    parentName,
    parentEmail,
    parentPhone,
    playerName,
    playerAge,
    message,
    budgetId,
    currentInterestCount,
  } = data

  const budgetUrl = `${APP_URL}/pre-season-budget/${budgetId}`

  const subject = `New Parent Interest: ${teamName} - ${season}`

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Parent Interest</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">

  <!-- Header -->
  <div style="background: linear-gradient(135deg, #7c3aed 0%, #9333ea 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; text-align: center;">
    <h1 style="margin: 0; font-size: 24px; font-weight: 600;">🎉 New Parent Interest!</h1>
    <p style="margin: 10px 0 0; opacity: 0.9; font-size: 14px;">${teamName} - ${season}</p>
  </div>

  <!-- Content -->
  <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">

    <p style="margin: 0 0 20px; font-size: 16px;">Hi ${coachName},</p>

    <p style="margin: 0 0 20px; font-size: 16px;">
      A parent has expressed interest in your team! You now have <strong>${currentInterestCount} interested ${currentInterestCount === 1 ? 'parent' : 'parents'}</strong>.
    </p>

    <!-- Parent & Player Details Card -->
    <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 20px 0;">

      <h3 style="margin: 0 0 15px; font-size: 16px; color: #7c3aed; font-weight: 600;">Parent Contact</h3>

      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px; width: 35%;">Name:</td>
          <td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 500;">${parentName}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Email:</td>
          <td style="padding: 8px 0; color: #2563eb; font-size: 14px;"><a href="mailto:${parentEmail}" style="color: #2563eb; text-decoration: none;">${parentEmail}</a></td>
        </tr>
        ${
          parentPhone
            ? `
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Phone:</td>
          <td style="padding: 8px 0; color: #111827; font-size: 14px;">${parentPhone}</td>
        </tr>
        `
            : ''
        }
      </table>

      <h3 style="margin: 20px 0 15px; font-size: 16px; color: #7c3aed; font-weight: 600; border-top: 1px solid #e5e7eb; padding-top: 15px;">Player Information</h3>

      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px; width: 35%;">Player Name:</td>
          <td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 500;">${playerName}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Age:</td>
          <td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 500;">${playerAge} years old</td>
        </tr>
        ${
          message
            ? `
        <tr>
          <td style="padding: 16px 0 8px; color: #6b7280; font-size: 14px; vertical-align: top; border-top: 1px solid #e5e7eb;">Message:</td>
          <td style="padding: 16px 0 8px; color: #111827; font-size: 14px; border-top: 1px solid #e5e7eb;">${message}</td>
        </tr>
        `
            : ''
        }
      </table>

    </div>

    <!-- Interest Count Badge -->
    <div style="background: #faf5ff; border: 1px solid #c084fc; border-radius: 8px; padding: 16px; margin: 20px 0; text-align: center;">
      <div style="font-size: 36px; font-weight: 700; color: #7c3aed;">
        ${currentInterestCount}
      </div>
      <div style="font-size: 14px; color: #6b21a8; font-weight: 500; margin-top: 5px;">
        Total Interested ${currentInterestCount === 1 ? 'Parent' : 'Parents'}
      </div>
    </div>

    <!-- Next Steps -->
    <div style="background: #eff6ff; border-left: 4px solid #3b82f6; padding: 16px 20px; margin: 20px 0; border-radius: 4px;">
      <p style="margin: 0; font-size: 14px; color: #1e40af; font-weight: 500;">
        <strong>💡 Tip:</strong>
      </p>
      <p style="margin: 8px 0 0; font-size: 14px; color: #1e40af;">
        Once you have enough committed players, you can activate your team in Squadbooks to begin managing finances and operations.
      </p>
    </div>

    <!-- Action Button -->
    <div style="text-align: center; margin: 30px 0 20px;">
      <a href="${budgetUrl}" style="display: inline-block; background: #7c3aed; color: white; padding: 16px 40px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(124, 58, 237, 0.2);">
        View All Interested Parents
      </a>
    </div>

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
New Parent Interest! - ${teamName} - ${season}

Hi ${coachName},

A parent has expressed interest in your team! You now have ${currentInterestCount} interested ${currentInterestCount === 1 ? 'parent' : 'parents'}.

Parent Contact:
--------------
Name: ${parentName}
Email: ${parentEmail}
${parentPhone ? `Phone: ${parentPhone}` : ''}

Player Information:
------------------
Player Name: ${playerName}
Age: ${playerAge} years old
${message ? `Message: ${message}` : ''}

Total Interested Parents: ${currentInterestCount}

Tip: Once you have enough committed players, you can activate your team in Squadbooks to begin managing finances and operations.

View all interested parents: ${budgetUrl}

---
This is an automated notification from Squadbooks
© ${new Date().getFullYear()} Squadbooks. All rights reserved.
`

  try {
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: coachEmail,
      subject,
      html: htmlContent,
      text: textContent,
    })

    console.log('Parent interest email sent successfully:', result)
    return { success: true, result }
  } catch (error) {
    console.error('Failed to send parent interest email:', error)
    return { success: false, error }
  }
}

// ========================
// Waitlist Emails
// ========================

/**
 * Send welcome email to waitlist signups
 */
export async function sendWaitlistWelcomeEmail(email: string) {
  const dashboardUrl = `${APP_URL}/dashboard`
  const subject = 'Welcome to Squadbooks! 🎉'

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Squadbooks</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">

  <!-- Header -->
  <div style="background: linear-gradient(135deg, #1e3a5f 0%, #2d5a7b 100%); color: white; padding: 40px; border-radius: 8px 8px 0 0; text-align: center;">
    <h1 style="margin: 0; font-size: 28px; font-weight: 600;">Welcome to Squadbooks! 🎉</h1>
    <p style="margin: 15px 0 0; opacity: 0.95; font-size: 16px;">Thanks for joining our community</p>
  </div>

  <!-- Content -->
  <div style="background: #ffffff; padding: 40px 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">

    <p style="margin: 0 0 20px; font-size: 16px;">Hi there,</p>

    <p style="margin: 0 0 20px; font-size: 16px;">
      Thanks for signing up for Squadbooks! We're excited to help you <strong>master your team's finances</strong>.
    </p>

    <p style="margin: 0 0 20px; font-size: 16px;">
      Squadbooks makes it simple to track expenses, manage budgets, and keep your sports team organized—no accounting degree required.
    </p>

    <!-- Features -->
    <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 25px; margin: 25px 0;">
      <h2 style="margin: 0 0 20px; font-size: 18px; color: #1e3a5f; font-weight: 600;">What you can do with Squadbooks:</h2>

      <div style="margin-bottom: 15px;">
        <div style="display: inline-block; width: 24px; height: 24px; background: #10b981; border-radius: 50%; text-align: center; vertical-align: middle; margin-right: 10px;">
          <span style="color: white; font-weight: bold; line-height: 24px; font-size: 14px;">✓</span>
        </div>
        <span style="font-size: 15px; color: #111827; vertical-align: middle;"><strong>Track expenses</strong> with easy receipt uploads</span>
      </div>

      <div style="margin-bottom: 15px;">
        <div style="display: inline-block; width: 24px; height: 24px; background: #10b981; border-radius: 50%; text-align: center; vertical-align: middle; margin-right: 10px;">
          <span style="color: white; font-weight: bold; line-height: 24px; font-size: 14px;">✓</span>
        </div>
        <span style="font-size: 15px; color: #111827; vertical-align: middle;"><strong>Manage budgets</strong> by category</span>
      </div>

      <div style="margin-bottom: 15px;">
        <div style="display: inline-block; width: 24px; height: 24px; background: #10b981; border-radius: 50%; text-align: center; vertical-align: middle; margin-right: 10px;">
          <span style="color: white; font-weight: bold; line-height: 24px; font-size: 14px;">✓</span>
        </div>
        <span style="font-size: 15px; color: #111827; vertical-align: middle;"><strong>Approve transactions</strong> with dual approval workflow</span>
      </div>

      <div>
        <div style="display: inline-block; width: 24px; height: 24px; background: #10b981; border-radius: 50%; text-align: center; vertical-align: middle; margin-right: 10px;">
          <span style="color: white; font-weight: bold; line-height: 24px; font-size: 14px;">✓</span>
        </div>
        <span style="font-size: 15px; color: #111827; vertical-align: middle;"><strong>Generate reports</strong> for transparency</span>
      </div>
    </div>

    <!-- CTA -->
    <div style="background: #eff6ff; border-left: 4px solid #3b82f6; padding: 20px; margin: 25px 0; border-radius: 4px;">
      <p style="margin: 0 0 10px; font-size: 15px; color: #1e40af; font-weight: 600;">
        Ready to get started?
      </p>
      <p style="margin: 0; font-size: 14px; color: #1e40af;">
        We'll be in touch soon with updates, tips, and resources to help you make the most of Squadbooks.
      </p>
    </div>

    <!-- Action Button -->
    <div style="text-align: center; margin: 35px 0 25px;">
      <a href="${dashboardUrl}" style="display: inline-block; background: #f59e0b; color: white; padding: 16px 48px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(245, 158, 11, 0.2);">
        Explore Squadbooks
      </a>
    </div>

    <p style="margin: 25px 0 0; font-size: 14px; color: #6b7280; text-align: center;">
      Have questions? Just reply to this email—we'd love to hear from you!
    </p>

  </div>

  <!-- Footer -->
  <div style="text-align: center; margin-top: 20px; padding: 20px; color: #9ca3af; font-size: 12px;">
    <p style="margin: 0 0 5px;">This is an automated message from Squadbooks</p>
    <p style="margin: 0;">© ${new Date().getFullYear()} Squadbooks. All rights reserved.</p>
  </div>

</body>
</html>
`

  const textContent = `
Welcome to Squadbooks!

Hi there,

Thanks for signing up for Squadbooks! We're excited to help you master your team's finances.

Squadbooks makes it simple to track expenses, manage budgets, and keep your sports team organized—no accounting degree required.

What you can do with Squadbooks:
✓ Track expenses with easy receipt uploads
✓ Manage budgets by category
✓ Approve transactions with dual approval workflow
✓ Generate reports for transparency

Ready to get started?
We'll be in touch soon with updates, tips, and resources to help you make the most of Squadbooks.

Explore Squadbooks: ${dashboardUrl}

Have questions? Just reply to this email—we'd love to hear from you!

---
This is an automated message from Squadbooks
© ${new Date().getFullYear()} Squadbooks. All rights reserved.
`

  try {
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject,
      html: htmlContent,
      text: textContent,
    })

    console.log('Waitlist welcome email sent successfully:', result)
    return { success: true, result }
  } catch (error) {
    console.error('Failed to send waitlist welcome email:', error)
    return { success: false, error }
  }
}
