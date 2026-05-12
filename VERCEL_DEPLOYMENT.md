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
OPENAI_API_KEY=
OPENAI_MODEL=
OPENAI_EMBED_MODEL=
NEXT_PUBLIC_APP_NAME=
NEXT_PUBLIC_APP_URL=
RESEND_API_KEY=
RESEND_FROM_EMAIL=
RESEND_REPLY_TO_EMAIL=
LEXORA_SUPPORT_EMAIL=
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
