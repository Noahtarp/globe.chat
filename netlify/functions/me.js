// netlify/functions/me.js
import jwt from 'jsonwebtoken';
import { getUser } from './_db.js';

export default async function handler(req, context) {
  const auth = req.headers.get('authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;

  if (!token) {
    return new Response(JSON.stringify({ error: 'no token' }), { status: 401 });
  }

  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return new Response(JSON.stringify({ error: 'invalid or expired token' }), { status: 401 });
  }

  const user = await getUser(payload.sub);
  if (!user) {
    return new Response(JSON.stringify({ error: 'user not found' }), { status: 404 });
  }

  return new Response(JSON.stringify({
    ok: true,
    user: { email: user.email, username: user.username },
  }), { status: 200 });
}

export const config = { path: '/api/me' };
