# Backend API Deployment Guide

The IPhey project consists of two parts:
1. **Frontend** (Next.js) - ✅ Already deployed to Cloudflare Pages
2. **Backend API** (Node.js/Express) - ⚠️ Needs separate deployment

## Current Status

🌐 **Frontend**: https://iphey.pages.dev (Live)  
⚠️ **Backend API**: Not yet deployed

The frontend is currently showing: "Backend API Not Configured" because the API server hasn't been deployed yet.

## Backend Deployment Options

### Option 1: Cloudflare Workers (Recommended)

Deploy the backend API as a Cloudflare Worker for seamless integration.

**Steps:**

1. **Update Dependencies** (Workers-compatible)
   ```bash
   # The current Express-based backend needs to be adapted for Workers
   # You may need to migrate to Hono or similar Workers-compatible framework
   ```

2. **Deploy to Workers**
   ```bash
   cd /path/to/iphey
   npx wrangler deploy src/worker.ts
   ```

3. **Set Environment Variables** in Cloudflare Dashboard
   - `IPINFO_TOKEN` - Your ipinfo.io API token
   - `CLOUDFLARE_RADAR_TOKEN` - Cloudflare Radar API token (optional)
   - Other required API keys (see `src/config.ts`)

4. **Update Frontend** to point to Worker URL
   ```bash
   # Add to Cloudflare Pages environment variables
   NEXT_PUBLIC_API_URL=https://your-worker.workers.dev
   ```

### Option 2: Railway / Render / Fly.io

Deploy as a traditional Node.js application.

**Railway Example:**

1. Install Railway CLI
   ```bash
   npm install -g @railway/cli
   ```

2. Login and deploy
   ```bash
   railway login
   railway init
   railway up
   ```

3. Set environment variables in Railway dashboard

4. Get deployment URL (e.g., `https://iphey-api.railway.app`)

5. Update Cloudflare Pages environment:
   ```bash
   gh secret set NEXT_PUBLIC_API_URL --body "https://iphey-api.railway.app" --repo 7and1/iphey
   ```

### Option 3: VPS / Docker

Deploy to a VPS using Docker.

**Steps:**

1. **Build Docker Image**
   ```bash
   docker build -t iphey-api .
   ```

2. **Run Container**
   ```bash
   docker run -d \
     -p 4310:4310 \
     -e IPINFO_TOKEN=your_token \
     -e CLOUDFLARE_RADAR_TOKEN=your_token \
     --name iphey-api \
     iphey-api
   ```

3. **Setup Reverse Proxy** (Nginx/Caddy) with HTTPS

4. **Update Frontend** with your API domain

## Required Environment Variables

The backend requires these environment variables (see `.env.example` or `src/config.ts`):

```bash
# Required
IPINFO_TOKEN=your_ipinfo_token

# Optional (at least one of these for enhanced features)
CLOUDFLARE_ACCOUNT_ID=your_account_id
CLOUDFLARE_RADAR_TOKEN=your_radar_token

# Server Configuration
PORT=4310
NODE_ENV=production
LOG_LEVEL=info

# Cache Configuration
CACHE_TTL_MS=300000
CACHE_MAX_ITEMS=500
```

## Testing the API

Once deployed, test the API:

```bash
# Health check
curl https://your-api-domain.com/api/v1/health

# Test report generation
curl -X POST https://your-api-domain.com/api/v1/report \
  -H "Content-Type: application/json" \
  -d '{"fingerprint":{"userAgent":"test"}}'
```

## Connecting Frontend to Backend

Once the backend is deployed:

1. **Add Environment Variable** in Cloudflare Pages:
   - Go to: https://dash.cloudflare.com/pages
   - Select `iphey` project
   - Go to Settings → Environment variables
   - Add: `NEXT_PUBLIC_API_URL` = `https://your-api-domain.com`

2. **Redeploy Frontend**:
   ```bash
   git commit --allow-empty -m "Trigger redeploy"
   git push
   ```

3. **Verify**: Visit https://iphey.pages.dev - should now load data!

## CORS Configuration

Make sure your backend allows requests from your frontend domain:

```typescript
// In src/app.ts
app.use(cors({
  origin: [
    'https://iphey.pages.dev',
    'https://*.iphey.pages.dev', // Preview deployments
    'https://iphey.org', // Custom domain if configured
  ],
  credentials: true,
}));
```

## Cost Considerations

| Option | Free Tier | Pricing |
|--------|-----------|---------|
| Cloudflare Workers | 100k requests/day | $5/month for 10M requests |
| Railway | 500 hours/month | ~$5/month for basic app |
| Render | 750 hours/month | Free tier available |
| Fly.io | 3 shared VMs | Free tier available |

## Next Steps

1. Choose a deployment option above
2. Deploy the backend API
3. Get the API URL
4. Update `NEXT_PUBLIC_API_URL` in Cloudflare Pages
5. Redeploy frontend
6. Enjoy your fully functional IPhey deployment! 🎉

## Need Help?

- Check the main [DEPLOYMENT.md](../DEPLOYMENT.md) for frontend deployment
- See [CONFIG.md](CONFIG.md) for configuration details
- Open an issue: https://github.com/7and1/iphey/issues
