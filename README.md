# 🌐 globe chat

Country-based video, voice & text chat with email auth. Built on Netlify Functions (no Firebase, no external DB).

---

## stack

- **frontend** — vanilla HTML/CSS/JS, Satoshi font, purple dark theme
- **backend** — Netlify Functions (serverless Node.js)
- **auth** — bcrypt password hashing + JWT tokens
- **email** — nodemailer via any SMTP (Gmail, Mailgun, Brevo, etc.)
- **database** — Netlify Blobs (built-in KV store, no setup needed)

---

## deploy to netlify via github

### 1. push to github

```bash
# in the globechat folder:
git init
git add .
git commit -m "initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/globechat.git
git push -u origin main
```

### 2. connect netlify

1. go to [app.netlify.com](https://app.netlify.com) → **Add new site** → **Import from Git**
2. choose GitHub, select your `globechat` repo
3. build settings are auto-detected from `netlify.toml`:
   - **publish directory:** `public`
   - **functions directory:** `netlify/functions`
4. click **Deploy site**

### 3. set environment variables

in Netlify → **Site settings** → **Environment variables**, add:

| key | value |
|-----|-------|
| `JWT_SECRET` | a long random string (run `openssl rand -hex 32`) |
| `SMTP_HOST` | `smtp.gmail.com` (or your provider) |
| `SMTP_PORT` | `587` |
| `SMTP_USER` | your email address |
| `SMTP_PASS` | your app password (see below) |
| `SITE_URL` | `https://yoursite.netlify.app` |
| `EMAIL_FROM` | `Globe Chat <noreply@yourdomain.com>` |

### 4. redeploy

after setting env vars, go to **Deploys** → **Trigger deploy** → **Deploy site**.

---

## smtp setup options

### option a — gmail (easiest)
1. enable 2FA on your Google account
2. go to [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
3. create an app password for "Mail"
4. use that 16-char password as `SMTP_PASS`
- `SMTP_HOST`: `smtp.gmail.com`
- `SMTP_PORT`: `587`
- `SMTP_USER`: `yourname@gmail.com`

### option b — brevo (free tier, 300 emails/day)
1. sign up at [brevo.com](https://brevo.com)
2. go to SMTP & API → SMTP tab
3. copy the credentials
- `SMTP_HOST`: `smtp-relay.brevo.com`
- `SMTP_PORT`: `587`
- `SMTP_USER`: your brevo login email
- `SMTP_PASS`: the SMTP key shown in brevo

### option c — mailgun / sendgrid
use their SMTP relay credentials the same way.

---

## local development

```bash
# install dependencies
npm install

# copy env file and fill in your values
cp .env.example .env

# run local dev server (requires netlify-cli)
npm run dev
# → opens at http://localhost:8888
```

---

## project structure

```
globechat/
├── public/
│   └── index.html          ← the entire frontend
├── netlify/
│   └── functions/
│       ├── _db.js          ← Netlify Blobs KV helper
│       ├── _mailer.js      ← nodemailer helper
│       ├── register.js     ← POST /api/register
│       ├── login.js        ← POST /api/login
│       ├── verify-email.js ← GET  /api/verify-email?token=...
│       ├── resend-verify.js← POST /api/resend-verify
│       └── me.js           ← GET  /api/me (validate JWT)
├── netlify.toml            ← build config + redirects
├── package.json
├── .env.example
└── .gitignore
```

---

## api endpoints

| method | path | description |
|--------|------|-------------|
| POST | `/api/register` | create account, sends verification email |
| POST | `/api/login` | login, returns JWT |
| GET | `/api/verify-email?token=X` | verify email from link |
| POST | `/api/resend-verify` | resend verification email |
| GET | `/api/me` | validate JWT, return user info |

---

## notes

- **Netlify Blobs** is the built-in KV store — zero config, no external DB needed. It's available on all Netlify plans including free.
- JWT tokens are stored in `localStorage` and auto-restored on page load.
- Face detection uses canvas pixel analysis (no ML library). Covers covered cameras, black frames, and uniform-color frames.
- Voice messages are recorded via MediaRecorder API and stored as object URLs in-session (not persisted).
