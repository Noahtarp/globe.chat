// netlify/functions/_mailer.js
import nodemailer from 'nodemailer';

export function getTransport() {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '587');
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    throw new Error(`SMTP not configured. host=${host} user=${user} pass=${pass ? '***' : 'MISSING'}`);
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
    // Brevo / some providers need this
    tls: { rejectUnauthorized: false },
  });
}

export async function sendVerificationCode(to, code) {
  const from = process.env.EMAIL_FROM || `Globe Chat <${process.env.SMTP_USER}>`;
  const transport = getTransport();

  // verify connection first so we get a clear error
  await transport.verify();

  await transport.sendMail({
    from,
    to,
    subject: `${code} is your globe chat code`,
    text: `your globe chat verification code is:\n\n${code}\n\nit expires in 15 minutes. if you didn't request this, ignore this email.`,
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="margin:0;padding:0;background:#120820;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#120820;padding:40px 16px;">
    <tr><td align="center">
      <table width="460" cellpadding="0" cellspacing="0" style="background:#1a0a2e;border:1px solid #3d1f6e;border-radius:16px;overflow:hidden;max-width:100%;">
        <tr>
          <td style="padding:28px 36px;border-bottom:1px solid #3d1f6e;">
            <p style="margin:0;font-size:18px;font-weight:700;color:#f0e8ff;">🌐 globe<span style="color:#9b59f5">.chat</span></p>
          </td>
        </tr>
        <tr>
          <td style="padding:36px;text-align:center;">
            <p style="margin:0 0 8px;color:#a890cc;font-size:14px;">your verification code</p>
            <div style="display:inline-block;background:#2a1445;border:2px solid #9b59f5;border-radius:12px;padding:20px 40px;margin:16px 0;">
              <span style="font-size:40px;font-weight:900;letter-spacing:12px;color:#f0e8ff;font-family:'Courier New',monospace;">${code}</span>
            </div>
            <p style="margin:16px 0 0;color:#a890cc;font-size:14px;line-height:1.6;">
              enter this code on globe chat to verify your account.<br>
              it expires in <strong style="color:#f0e8ff;">15 minutes</strong>.
            </p>
            <p style="margin:20px 0 0;color:#6b4f8a;font-size:12px;">
              if you didn't request this, ignore this email.
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding:20px 36px;border-top:1px solid #3d1f6e;">
            <p style="margin:0;color:#6b4f8a;font-size:12px;">globe.chat — connect with the world</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
  });
}
