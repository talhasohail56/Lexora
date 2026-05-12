# Vercel Deployment

Lexora is ready for Vercel. Do not commit real `.env` files to GitHub.

## One-Time Setup

1. Import `https://github.com/talhasohail56/Lexora` in Vercel.
2. In Vercel project settings, open **Environment Variables**.
3. Use **Import .env** and upload the local file:

```text
/Users/talhasohail/ai-paralegal-v2/.env.vercel
```

4. Make sure Google OAuth has this authorized redirect URI:

```text
https://YOUR_VERCEL_DOMAIN/api/auth/google/callback
```

5. Update these two Vercel env values after the domain is known:

```env
NEXT_PUBLIC_APP_URL="https://YOUR_VERCEL_DOMAIN"
GOOGLE_REDIRECT_URI="https://YOUR_VERCEL_DOMAIN/api/auth/google/callback"
```

## Required Variables

```env
DATABASE_URL=
JWT_SECRET=
SESSION_MAX_AGE_DAYS=
WARMUP_SECRET=
OPENAI_API_KEY=
OPENAI_MODEL=
OPENAI_EMBED_MODEL=
NEXT_PUBLIC_APP_NAME=
NEXT_PUBLIC_APP_URL=
RESEND_API_KEY=
RESEND_FROM_EMAIL=
RESEND_REPLY_TO_EMAIL=
LEXORA_SUPPORT_EMAIL=
EMAIL_FROM_NAME=
GMAIL_USER=
GMAIL_APP_PASSWORD=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=
```

## Build Settings

Vercel can use the defaults:

```text
Install Command: npm install
Build Command: npm run build
Output Directory: .next
```

The app uses Prisma with PostgreSQL. The Supabase `DATABASE_URL` must be present before build/deploy.
For Supabase pooler connections, keep Prisma constrained to one DB connection per runtime:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:6543/postgres?sslmode=require&pgbouncer=true&connection_limit=3&pool_timeout=20"
```

## Reducing Cold Database Latency

This project runs Vercel Functions in Singapore via `vercel.json`:

```json
{ "regions": ["sin1"] }
```

That keeps the Node.js functions close to the Supabase `ap-southeast-1` database and removes avoidable cross-region latency.

The app also exposes a lightweight warmup endpoint:

```text
GET /api/health/warmup
```

If `WARMUP_SECRET` is set, call it with:

```bash
curl -H "Authorization: Bearer $WARMUP_SECRET" https://YOUR_VERCEL_DOMAIN/api/health/warmup
```

Use an external uptime monitor such as UptimeRobot, Better Stack, cron-job.org, or GitHub Actions to call this every 5-10 minutes. Vercel Hobby cron jobs only run daily, so they are not enough for frequent warming. Vercel Pro cron can run every minute if you later upgrade.

This repo includes `.github/workflows/keep-warm.yml`, which pings:

```text
https://lexora-sage.vercel.app/api/health/warmup
```

every 5 minutes. If the deployment domain changes, set this GitHub repository variable:

```text
LEXORA_WARMUP_URL=https://YOUR_VERCEL_DOMAIN/api/health/warmup
```

If you set `WARMUP_SECRET` in Vercel, add the same value as a GitHub Actions secret named `WARMUP_SECRET`.
