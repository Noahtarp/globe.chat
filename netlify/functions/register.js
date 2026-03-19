// netlify/functions/register.js
import bcrypt from 'bcryptjs';
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

  const { email, password, username } = body;

  // validation
  if (!email || !password || !username) {
    return new Response(JSON.stringify({ error: 'email, password and username are required' }), { status: 400 });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return new Response(JSON.stringify({ error: 'invalid email address' }), { status: 400 });
  }
  if (password.length < 8) {
    return new Response(JSON.stringify({ error: 'password must be at least 8 characters' }), { status: 400 });
  }
  if (username.length < 2 || username.length > 24) {
    return new Response(JSON.stringify({ error: 'username must be 2–24 characters' }), { status: 400 });
  }

  // check existing
  const existing = await getUser(email);
  if (existing) {
    return new Response(JSON.stringify({ error: 'an account with this email already exists' }), { status: 409 });
  }

  // hash password
  const hash = await bcrypt.hash(password, 12);
  const verifyToken = uuidv4();
  const now = Date.now();

  const user = {
    email: email.toLowerCase().trim(),
    username: username.trim(),
    password: hash,
    verified: false,
    verifyToken,
    verifyTokenExpires: now + 24 * 60 * 60 * 1000, // 24h
    createdAt: now,
  };

  await setUser(email, user);
  await setTokenIndex(verifyToken, email);

  // send verification email
  try {
    await sendVerificationEmail(user.email, verifyToken);
  } catch (err) {
    console.error('email send failed:', err);
    // Don't fail registration if email fails — user can request resend
    return new Response(JSON.stringify({
      ok: true,
      emailSent: false,
      message: 'account created but verification email failed to send. check your smtp settings.',
    }), { status: 201 });
  }

  return new Response(JSON.stringify({
    ok: true,
    emailSent: true,
    message: 'account created! check your email to verify your account.',
  }), { status: 201 });
}

export const config = { path: '/api/register' };
