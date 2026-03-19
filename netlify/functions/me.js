// netlify/functions/me.js
import jwt from 'jsonwebtoken';
import { getUser } from './_db.js';

export default async function handler(req, context) {
  const auth = req.headers.get('authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;

  if (!token) {
    return json({ error: 'no token' }, 401);
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) return json({ error: 'server config error' }, 500);

  let payload;
  try { payload = jwt.verify(token, secret); }
  catch { return json({ error: 'invalid or expired token' }, 401); }

  const user = await getUser(payload.sub);
  if (!user) return json({ error: 'user not found' }, 404);

  return json({ ok: true, user: { email: user.email, username: user.username } });
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

export const config = { path: '/api/me' };
