// netlify/functions/login.js
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getUser } from './_db.js';

export default async function handler(req, context) {
  if (req.method !== 'POST') {
    return json({ error: 'method not allowed' }, 405);
  }

  let body;
  try { body = await req.json(); }
  catch { return json({ error: 'invalid json' }, 400); }

  const { email, password } = body;
  if (!email || !password) {
    return json({ error: 'email and password are required' }, 400);
  }

  const user = await getUser(email);
  if (!user) {
    return json({ error: 'invalid email or password' }, 401);
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    return json({ error: 'invalid email or password' }, 401);
  }

  if (!user.verified) {
    return json({
      error: 'please verify your email first. check your inbox for a 6-digit code.',
      unverified: true,
      email: user.email,
    }, 403);
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    console.error('JWT_SECRET not set');
    return json({ error: 'server configuration error — JWT_SECRET missing' }, 500);
  }

  const token = jwt.sign(
    { sub: user.email, username: user.username },
    secret,
    { expiresIn: '30d' }
  );

  return json({ ok: true, token, user: { email: user.email, username: user.username } });
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

export const config = { path: '/api/login' };
