// netlify/functions/register.js
import bcrypt from 'bcryptjs';
import { getUser, setUser, setCodeIndex } from './_db.js';
import { sendVerificationCode } from './_mailer.js';

function generateCode() {
  // 6-digit numeric code
  return String(Math.floor(100000 + Math.random() * 900000));
}

export default async function handler(req, context) {
  if (req.method !== 'POST') {
    return json({ error: 'method not allowed' }, 405);
  }

  let body;
  try { body = await req.json(); }
  catch { return json({ error: 'invalid json' }, 400); }

  const { email, password, username } = body;

  if (!email || !password || !username) {
    return json({ error: 'email, password and username are required' }, 400);
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json({ error: 'invalid email address' }, 400);
  }
  if (password.length < 8) {
    return json({ error: 'password must be at least 8 characters' }, 400);
  }
  if (username.length < 2 || username.length > 24) {
    return json({ error: 'username must be 2–24 characters' }, 400);
  }

  const existing = await getUser(email);
  if (existing && existing.verified) {
    return json({ error: 'an account with this email already exists' }, 409);
  }

  const hash = await bcrypt.hash(password, 10);
  const code = generateCode();
  const now = Date.now();

  const user = {
    email: email.toLowerCase().trim(),
    username: username.trim(),
    password: hash,
    verified: false,
    verifyCode: code,
    verifyCodeExpires: now + 15 * 60 * 1000, // 15 minutes
    createdAt: now,
  };

  await setUser(email, user);
  await setCodeIndex(code, email);

  try {
    await sendVerificationCode(user.email, code);
  } catch (err) {
    console.error('[register] email failed:', err.message);
    // Return the actual error so it's visible during setup
    return json({
      ok: false,
      emailSent: false,
      error: `account saved but email failed: ${err.message}`,
    }, 500);
  }

  return json({ ok: true, emailSent: true }, 201);
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

export const config = { path: '/api/register' };
