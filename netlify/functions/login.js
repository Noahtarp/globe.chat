// netlify/functions/login.js
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getUser } from './_db.js';

export default async function handler(req, context) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'method not allowed' }), { status: 405 });
  }

  let body;
  try { body = await req.json(); }
  catch { return new Response(JSON.stringify({ error: 'invalid json' }), { status: 400 }); }

  const { email, password } = body;

  if (!email || !password) {
    return new Response(JSON.stringify({ error: 'email and password are required' }), { status: 400 });
  }

  const user = await getUser(email);

  if (!user) {
    // generic message to avoid email enumeration
    return new Response(JSON.stringify({ error: 'invalid email or password' }), { status: 401 });
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    return new Response(JSON.stringify({ error: 'invalid email or password' }), { status: 401 });
  }

  if (!user.verified) {
    return new Response(JSON.stringify({
      error: 'please verify your email before logging in. check your inbox.',
      unverified: true,
    }), { status: 403 });
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    console.error('JWT_SECRET not set');
    return new Response(JSON.stringify({ error: 'server configuration error' }), { status: 500 });
  }

  const token = jwt.sign(
    { sub: user.email, username: user.username },
    secret,
    { expiresIn: '30d' }
  );

  return new Response(JSON.stringify({
    ok: true,
    token,
    user: { email: user.email, username: user.username },
  }), { status: 200 });
}

export const config = { path: '/api/login' };
