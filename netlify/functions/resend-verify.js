// netlify/functions/resend-verify.js
import { getUser, setUser, setCodeIndex } from './_db.js';
import { sendVerificationCode } from './_mailer.js';

function generateCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export default async function handler(req, context) {
  if (req.method !== 'POST') {
    return json({ error: 'method not allowed' }, 405);
  }

  let body;
  try { body = await req.json(); }
  catch { return json({ error: 'invalid json' }, 400); }

  const { email } = body;
  if (!email) return json({ error: 'email is required' }, 400);

  const user = await getUser(email);
  if (!user || user.verified) {
    // don't leak whether email exists
    return json({ ok: true }, 200);
  }

  const code = generateCode();
  await setUser(email, {
    ...user,
    verifyCode: code,
    verifyCodeExpires: Date.now() + 15 * 60 * 1000,
  });
  await setCodeIndex(code, email);

  try {
    await sendVerificationCode(user.email, code);
  } catch (err) {
    console.error('[resend] email failed:', err.message);
    return json({ error: `email failed: ${err.message}` }, 500);
  }

  return json({ ok: true }, 200);
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

export const config = { path: '/api/resend-verify' };
