// netlify/functions/verify-code.js
import { getUserByCode, setUser, deleteCodeIndex } from './_db.js';

export default async function handler(req, context) {
  if (req.method !== 'POST') {
    return json({ error: 'method not allowed' }, 405);
  }

  let body;
  try { body = await req.json(); }
  catch { return json({ error: 'invalid json' }, 400); }

  const { email, code } = body;

  if (!email || !code) {
    return json({ error: 'email and code are required' }, 400);
  }

  const user = await getUserByCode(code.trim());

  if (!user) {
    return json({ error: 'invalid code. please check and try again.' }, 400);
  }

  // Make sure the code belongs to this email
  if (user.email !== email.toLowerCase().trim()) {
    return json({ error: 'invalid code for this email.' }, 400);
  }

  if (Date.now() > user.verifyCodeExpires) {
    return json({ error: 'this code has expired. please request a new one.' }, 400);
  }

  if (user.verified) {
    return json({ ok: true, alreadyVerified: true }, 200);
  }

  await setUser(user.email, {
    ...user,
    verified: true,
    verifyCode: null,
    verifyCodeExpires: null,
    verifiedAt: Date.now(),
  });

  await deleteCodeIndex(code.trim());

  return json({ ok: true }, 200);
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

export const config = { path: '/api/verify-code' };
