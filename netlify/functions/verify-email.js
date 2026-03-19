// netlify/functions/verify-email.js
import { getUserByToken, setUser } from './_db.js';

export default async function handler(req, context) {
  const url = new URL(req.url);
  const token = url.searchParams.get('token');

  if (!token) {
    return htmlResponse('invalid link', 'missing verification token.', false);
  }

  const user = await getUserByToken(token);

  if (!user) {
    return htmlResponse('invalid link', 'this verification link is invalid or has already been used.', false);
  }

  if (Date.now() > user.verifyTokenExpires) {
    return htmlResponse('link expired', 'this verification link has expired. please register again or request a new link.', false);
  }

  if (user.verified) {
    return htmlResponse('already verified', 'your email is already verified. you can log in.', true);
  }

  // mark verified
  await setUser(user.email, {
    ...user,
    verified: true,
    verifyToken: null,
    verifyTokenExpires: null,
    verifiedAt: Date.now(),
  });

  return htmlResponse('email verified!', 'your account is now active. you can close this tab and log in.', true);
}

function htmlResponse(title, message, success) {
  const color = success ? '#9b59f5' : '#f04060';
  const icon = success ? '✓' : '✗';
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title} — globe chat</title>
<link href="https://api.fontshare.com/v2/css?f[]=satoshi@400,700,900&display=swap" rel="stylesheet">
<style>
  *{box-sizing:border-box;margin:0;padding:0;}
  body{font-family:'Satoshi',sans-serif;background:#120820;color:#f0e8ff;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:2rem;}
  .card{background:#1a0a2e;border:1px solid #3d1f6e;border-radius:16px;padding:2.5rem;max-width:400px;width:100%;text-align:center;}
  .icon{font-size:3rem;margin-bottom:1rem;color:${color};}
  h1{font-size:1.5rem;font-weight:900;color:${color};letter-spacing:-0.02em;text-transform:lowercase;margin-bottom:0.75rem;}
  p{color:#a890cc;font-size:0.9rem;line-height:1.6;margin-bottom:1.5rem;}
  a{display:inline-block;padding:0.7rem 1.5rem;background:#9b59f5;color:#fff;text-decoration:none;border-radius:20px;font-weight:700;font-size:0.875rem;box-shadow:0 0 16px rgba(155,89,245,0.35);}
</style>
</head>
<body>
  <div class="card">
    <div class="icon">${icon}</div>
    <h1>${title}</h1>
    <p>${message}</p>
    <a href="/">go to globe chat →</a>
  </div>
</body>
</html>`;
  return new Response(html, {
    status: 200,
    headers: { 'content-type': 'text/html' },
  });
}

export const config = { path: '/api/verify-email' };
