// netlify/functions/resend-verify.js
import { v4 as uuidv4 } from 'uuid';
import { getUser, setUser, setTokenIndex } from './_db.js';
import { sendVerificationEmail } from './_mailer.js';

export default async function handler(req, context) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'method not allowed' }), { status: 405 });
  }

  let body;
  try { body = await req.json(); }
  catch { return new Response(JSON.stringify({ error: 'invalid json' }), { status: 400 }); }

  const { email } = body;
  if (!email) {
    return new Response(JSON.stringify({ error: 'email is required' }), { status: 400 });
  }

  const user = await getUser(email);

  // Always return 200 to avoid email enumeration
  if (!user || user.verified) {
    return new Response(JSON.stringify({ ok: true, message: 'if that email exists and is unverified, a new link has been sent.' }), { status: 200 });
  }

  const verifyToken = uuidv4();
  await setUser(email, {
    ...user,
    verifyToken,
    verifyTokenExpires: Date.now() + 24 * 60 * 60 * 1000,
  });
  await setTokenIndex(verifyToken, email);

  try {
    await sendVerificationEmail(user.email, verifyToken);
  } catch (err) {
    console.error('resend email failed:', err);
    return new Response(JSON.stringify({ error: 'failed to send email. check smtp settings.' }), { status: 500 });
  }

  return new Response(JSON.stringify({ ok: true, message: 'verification email resent.' }), { status: 200 });
}

export const config = { path: '/api/resend-verify' };
