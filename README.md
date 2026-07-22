# Duncanville Mongo Proxy

Tiny HTTPS bridge so the Lovable app (Cloudflare Workers, no TCP) can talk to MongoDB Atlas. Deploy once to Vercel.

## Deploy

1. `npm i -g vercel`
2. `cd mongo-proxy && vercel` (accept defaults)
3. In Vercel dashboard → Settings → Environment Variables, add:
   - `MONGODB_URI` — your Atlas SRV connection string
   - `MONGODB_DB` — e.g. `duncanville`
   - `MONGO_PROXY_TOKEN` — long random string (`openssl rand -hex 32`)
4. `vercel --prod`
5. Copy the production URL.

## Wire into Lovable

Add two Lovable secrets:
- `MONGO_PROXY_URL` = the Vercel URL
- `MONGO_PROXY_TOKEN` = the same token you set in Vercel

## Endpoints

All require `Authorization: Bearer $MONGO_PROXY_TOKEN`.

- `POST /api/verify` — upsert a VerificationRecord
- `GET  /api/verify?discord_id=...` — fetch (404 if none)

## Atlas Network Access

Whitelist Vercel's egress or (simplest) allow `0.0.0.0/0` — the bearer token protects the proxy.
# duncanville
# duncanville
