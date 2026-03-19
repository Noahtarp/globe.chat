// netlify/functions/_mailer.js
import nodemailer from 'nodemailer';

export function getTransport() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: parseInt(process.env.SMTP_PORT || '587') === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

export async function sendVerificationEmail(to, token) {
  const siteUrl = (process.env.SITE_URL || 'http://localhost:8888').replace(/\/$/, '');
  const verifyUrl = `${siteUrl}/api/verify-email?token=${token}`;
  const from = process.env.EMAIL_FROM || 'Globe Chat <noreply@globechat.app>';

  const transport = getTransport();

  await transport.sendMail({
    from,
    to,
    subject: 'verify your globe chat account',
    text: `welcome to globe chat!\n\nclick the link below to verify your email:\n\n${verifyUrl}\n\nthis link expires in 24 hours.\n\nif you didn't sign up, ignore this email.`,
    html: `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width">
</head>
<body style="margin:0;padding:0;background:#120820;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#120820;padding:40px 0;">
    <tr><td align="center">
      <table width="480" cellpadding="0" cellspacing="0" style="background:#1a0a2e;border:1px solid #3d1f6e;border-radius:16px;overflow:hidden;max-width:90vw;">
        <!-- header -->
        <tr>
          <td style="background:linear-gradient(135deg,#2a1445,#1a0a2e);padding:28px 36px;border-bottom:1px solid #3d1f6e;">
            <p style="margin:0;font-size:1.2rem;font-weight:700;color:#f0e8ff;letter-spacing:-0.01em;">🌐 globe<span style="color:#9b59f5">.chat</span></p>
          </td>
        </tr>
        <!-- body -->
        <tr>
          <td style="padding:36px;">
            <h2 style="margin:0 0 12px;font-size:1.4rem;font-weight:700;color:#f0e8ff;letter-spacing:-0.02em;">verify your email</h2>
            <p style="margin:0 0 24px;color:#a890cc;font-size:0.9rem;line-height:1.6;">
              welcome to globe chat — click the button below to verify your email address and activate your account.
            </p>
            <a href="${verifyUrl}"
               style="display:inline-block;padding:13px 28px;background:#9b59f5;color:#fff;text-decoration:none;border-radius:20px;font-weight:700;font-size:0.9rem;box-shadow:0 0 20px rgba(155,89,245,0.4);">
              verify my email →
            </a>
            <p style="margin:24px 0 0;color:#6b4f8a;font-size:0.75rem;line-height:1.6;">
              or paste this link in your browser:<br>
              <span style="color:#9b59f5;word-break:break-all;">${verifyUrl}</span>
            </p>
            <p style="margin:16px 0 0;color:#6b4f8a;font-size:0.72rem;">
              this link expires in 24 hours. if you didn't create an account, ignore this email.
            </p>
          </td>
        </tr>
        <!-- footer -->
        <tr>
          <td style="padding:20px 36px;border-top:1px solid #3d1f6e;">
            <p style="margin:0;color:#6b4f8a;font-size:0.7rem;">globe.chat — connect with the world</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
  });
}
