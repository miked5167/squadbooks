import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

interface SendInvitationParams {
  to: string;
  name: string;
  teamName: string;
  role: string;
  inviteUrl: string;
}

export async function sendInvitationEmail({
  to,
  name,
  teamName,
  role,
  inviteUrl,
}: SendInvitationParams) {
  const roleDescription = getRoleDescription(role);

  await resend.emails.send({
    from: 'HuddleBooks <hello@huddlebooks.com>',
    to,
    subject: `You've been invited to join ${teamName}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #003F87;">You've been invited!</h1>

        <p>Hi ${name},</p>

        <p>
          You've been invited to join <strong>${teamName}</strong> on HuddleBooks,
          where we track team finances together.
        </p>

        <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 24px 0;">
          <p style="margin: 0;"><strong>Your role:</strong> ${role}</p>
          <p style="margin: 8px 0 0 0; color: #6b7280; font-size: 14px;">
            ${roleDescription}
          </p>
        </div>

        <p>
          <a
            href="${inviteUrl}"
            style="
              display: inline-block;
              background: #003F87;
              color: white;
              padding: 12px 24px;
              text-decoration: none;
              border-radius: 6px;
              font-weight: 500;
            "
          >
            Accept Invitation →
          </a>
        </p>

        <p style="color: #6b7280; font-size: 14px;">
          This invitation expires in 7 days.
        </p>

        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 32px 0;" />

        <p style="color: #6b7280; font-size: 12px;">
          Questions? Reply to this email or visit our help center.
        </p>
      </div>
    `,
  });
}

function getRoleDescription(role: string): string {
  const descriptions: Record<string, string> = {
    PRESIDENT: 'Approve expenses and view all team finances',
    BOARD_MEMBER: 'Approve expenses and view financial reports',
    PARENT: 'View team budget and family payment status',
  };
  return descriptions[role] || 'Team member access';
}
