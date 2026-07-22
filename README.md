# Duncanville Mongo Proxy

Tiny HTTPS bridge so the Lovable app (Cloudflare Workers, no TCP) can talk to MongoDB Atlas. Deploy once to Vercel.

## Deploy

1. `npm i -g vercel`
2. `cd mongo-proxy && vercel` (accept defaults). If deploying from a Git repository, set Vercel's **Root Directory** to `mongo-proxy`.
3. In Vercel dashboard → Settings → Environment Variables, add:
   - `MONGODB_URI` — your Atlas SRV connection string
   - `MONGODB_DB` — e.g. `duncanville`
   - `MONGO_PROXY_TOKEN` — long random string (`openssl rand -hex 32`)
4. `vercel --prod`
5. Copy the production URL. Opening it in a browser should return JSON containing `"ok": true`.

## Wire into Lovable

Add two Lovable secrets:
- `MONGO_PROXY_URL` = the Vercel URL
- `MONGO_PROXY_TOKEN` = the same token you set in Vercel

## Endpoints

All require `Authorization: Bearer $MONGO_PROXY_TOKEN`.

- `GET  /` — public deployment health check
- `POST /api/verify` — upsert a VerificationRecord
- `GET  /api/verify?discord_id=...` — fetch (404 if none)

Opening `/api/verify` directly without its bearer token should return `401 unauthorized`. That response confirms the function is deployed and protected; Vercel's branded `404: NOT_FOUND` means the project root directory or deployment is incorrect.

## Atlas Network Access

Whitelist Vercel's egress or (simplest) allow `0.0.0.0/0` — the bearer token protects the proxy.
