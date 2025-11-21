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
