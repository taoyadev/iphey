# IPhey Deployment Guide

This guide explains how to deploy IPhey (Backend API + Frontend) to Cloudflare using GitHub Actions.

## 🔐 Security Note

This project uses GitHub Secrets to store sensitive credentials securely. The deployment process never exposes API tokens in the codebase.

## 📋 Prerequisites

1. **GitHub Account** - You need a GitHub account to host the repository
2. **Cloudflare Account** - Sign up at [cloudflare.com](https://www.cloudflare.com/)
3. **API Keys** - Required third-party service API keys:
   - **IPInfo.io** - Sign up at [ipinfo.io](https://ipinfo.io/) for IP geolocation data
   - **AbuseIPDB** - Sign up at [abuseipdb.com](https://www.abuseipdb.com/) for threat intelligence
   - **Cloudflare Radar** - Available in your Cloudflare account for ASN data
4. **GitHub CLI** - Install from [cli.github.com](https://cli.github.com/) (optional, for easy setup)

## 🚀 Quick Deployment

### Step 1: Get Required API Keys

Before deploying, gather these credentials:

#### Cloudflare Credentials
1. **Account ID**: Go to [Cloudflare Dashboard](https://dash.cloudflare.com/) → Select your account → Copy Account ID from sidebar
2. **API Token**: Go to [API Tokens](https://dash.cloudflare.com/profile/api-tokens) → Create Token → Use "Edit Cloudflare Workers" template

#### Third-Party API Keys
1. **IPInfo Token**: [ipinfo.io/signup](https://ipinfo.io/signup) → Dashboard → Copy Token
2. **AbuseIPDB API Key**: [abuseipdb.com](https://www.abuseipdb.com/) → Account → API → Copy Key
3. **Cloudflare Radar Token**: Same as Cloudflare API Token (or create a separate one)

#### GitHub Token (Optional - for automated setup)
1. Go to [GitHub Settings → Tokens](https://github.com/settings/tokens)
2. Click "Generate new token (classic)"
3. Select scopes: `repo`, `workflow`
4. Generate and copy the token

### Step 2: Set GitHub Secrets

You have two options:

#### Option A: Using GitHub CLI (Recommended)

```bash
# Login to GitHub CLI
gh auth login

# Set all required secrets
gh secret set CLOUDFLARE_API_TOKEN --body "your_cloudflare_api_token"
gh secret set CLOUDFLARE_ACCOUNT_ID --body "your_cloudflare_account_id"
gh secret set IPINFO_TOKEN --body "your_ipinfo_token"
gh secret set CLOUDFLARE_RADAR_TOKEN --body "your_cloudflare_radar_token"
gh secret set ABUSEIPDB_API_KEY --body "your_abuseipdb_api_key"
gh secret set NEXT_PUBLIC_API_URL --body "https://iphey-api.difft.workers.dev"
```

#### Option B: Using GitHub Web Interface

1. Go to your GitHub repository
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret** and add each of these:

| Secret Name | Description | Example |
|------------|-------------|---------|
| `CLOUDFLARE_API_TOKEN` | Cloudflare API Token | `YOUR_CLOUDFLARE_API_TOKEN` |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare Account ID | `YOUR_ACCOUNT_ID` |
| `IPINFO_TOKEN` | IPInfo.io API Token | `YOUR_IPINFO_TOKEN` |
| `CLOUDFLARE_RADAR_TOKEN` | Cloudflare Radar Token | `YOUR_RADAR_TOKEN` |
| `ABUSEIPDB_API_KEY` | AbuseIPDB API Key | `YOUR_ABUSEIPDB_KEY` |
| `NEXT_PUBLIC_API_URL` | Production API URL | `https://iphey-api.YOUR_SUBDOMAIN.workers.dev` |

### Step 3: Verify Secrets

```bash
# List all configured secrets
gh secret list

# Should show:
# ABUSEIPDB_API_KEY
# CLOUDFLARE_ACCOUNT_ID
# CLOUDFLARE_API_TOKEN
# CLOUDFLARE_RADAR_TOKEN
# IPINFO_TOKEN
# NEXT_PUBLIC_API_URL
```

### Step 4: Deploy

#### Automatic Deployment (Push to Main)

```bash
git add .
git commit -m "Deploy IPhey to Cloudflare"
git push origin main
```

The GitHub Actions workflow will automatically:
1. ✅ Build the backend (Cloudflare Worker)
2. ✅ Deploy backend to `iphey-api.difft.workers.dev`
3. ✅ Build the frontend (Next.js)
4. ✅ Deploy frontend to Cloudflare Pages

#### Manual Trigger

You can also trigger deployment manually:
1. Go to **Actions** tab in your GitHub repository
2. Select **Deploy to Cloudflare** workflow
3. Click **Run workflow** → **Run workflow**

## 📦 What Gets Deployed

### Backend API (Cloudflare Worker)
- **URL**: `https://iphey-api.difft.workers.dev`
- **Endpoints**:
  - `GET /api/v1/ip/enhanced` - Client IP analysis
  - `GET /api/v1/ip/:ip/enhanced` - Specific IP analysis
  - `GET /api/v1/services/status` - Service health check
  - `GET /api/v1/threats/:ip` - Threat intelligence
  - `GET /api/v1/asn/:asn` - ASN analysis
- **Features**:
  - IP geolocation (IPInfo.io)
  - Threat intelligence (AbuseIPDB)
  - ASN analysis (Cloudflare Radar)
  - KV cache for performance

### Frontend (Cloudflare Pages)
- **URL**: `https://iphey.pages.dev` (or custom domain)
- **Features**:
  - Interactive IP analysis dashboard
  - Browser fingerprint detection
  - Leak detection and privacy analysis
  - Real-time threat assessment

## 🔄 Continuous Deployment

Once set up, every push to the `main` branch will automatically:

1. Build and deploy the Cloudflare Worker (Backend API)
2. Build the Next.js application (Frontend)
3. Deploy frontend to Cloudflare Pages
4. Make both services available at their respective URLs

## 🛠️ Local Development

The deployment configuration doesn't affect local development:

```bash
# Start backend API (port 4310)
npm run dev

# Start frontend (port 3002) - in a new terminal
npm run web:dev

# Frontend will connect to local backend at http://localhost:4310
```

### Setting Secrets for Local Worker Development

If you want to test the Worker locally:

```bash
# Create .env file with secrets (gitignored)
cat > .env << EOF
IPINFO_TOKEN=your_ipinfo_token
CLOUDFLARE_RADAR_TOKEN=your_cloudflare_radar_token
ABUSEIPDB_API_KEY=your_abuseipdb_api_key
EOF

# Run worker locally
npm run worker:dev
```

### Setting Secrets for Production Worker

To manually set secrets for the deployed Worker (alternative to GitHub Actions):

```bash
# Set secrets using wrangler CLI
npx wrangler secret put IPINFO_TOKEN
npx wrangler secret put CLOUDFLARE_RADAR_TOKEN
npx wrangler secret put ABUSEIPDB_API_KEY

# List all secrets (values are hidden)
npx wrangler secret list
```

## 🌐 Custom Domain

To use a custom domain:

1. Go to Cloudflare Pages Dashboard
2. Select your project (iphey)
3. Go to "Custom domains" tab
4. Add your domain (e.g., `iphey.org`)
5. Follow DNS configuration instructions

## 📊 Monitoring Deployments

- **GitHub Actions**: https://github.com/your-username/iphey/actions
- **Cloudflare Pages**: https://dash.cloudflare.com/pages

## 🛠️ Local Development

The deployment configuration doesn't affect local development:

```bash
# Start development servers
npm run dev          # Backend API (port 4310)
npm run web:dev      # Frontend (port 3002)
```

## 🔍 Troubleshooting

### Worker Deployment Fails

Check if secrets are set correctly:

```bash
gh secret list
```

Verify you have all required secrets:
- CLOUDFLARE_API_TOKEN
- CLOUDFLARE_ACCOUNT_ID
- IPINFO_TOKEN
- CLOUDFLARE_RADAR_TOKEN
- ABUSEIPDB_API_KEY
- NEXT_PUBLIC_API_URL

### Worker Runtime Errors

Check Worker logs:

```bash
# View real-time logs
npm run worker:tail

# Or use wrangler directly
npx wrangler tail iphey-api
```

### Frontend Can't Connect to Worker

1. Verify Worker is deployed: Visit `https://iphey-api.difft.workers.dev/api/v1/services/status`
2. Check CORS settings in `src/app.ts`
3. Verify `NEXT_PUBLIC_API_URL` secret matches Worker URL

### Build Fails with "Command not found: wrangler"

The GitHub Action uses `cloudflare/wrangler-action@v3` which includes wrangler. No additional setup needed.

### Secrets Not Working

Verify secrets are set correctly:

```bash
gh secret list
```

Re-set a secret if needed:

```bash
gh secret set SECRET_NAME --body "new_value"
```

### Deployment Shows Old Content

Clear Cloudflare cache:

**For Pages:**
1. Go to Cloudflare Pages Dashboard
2. Select your project
3. Go to "Deployments" tab
4. Click "Retry deployment"

**For Worker:**
```bash
# Redeploy the worker
npm run worker:deploy
```

### KV Namespace Not Found

If you get KV namespace errors, create the namespace:

```bash
# Create KV namespace
npm run kv:create

# Update wrangler.toml with the returned namespace ID
```

## 📝 Files Reference

### Deployment Configuration
- `.github/workflows/deploy.yml` - GitHub Actions workflow (both Worker + Pages)
- `wrangler.toml` - Cloudflare Worker configuration (production)
- `wrangler-api.toml` - Cloudflare Worker configuration (with account details)

### Application Files
- `src/worker.ts` - Worker entry point (backend API)
- `apps/web-next/` - Next.js frontend application
- `apps/web-next/next.config.mjs` - Next.js static export config

### Security Files
- `.env` - Local development secrets (gitignored, never commit)
- `.env.local` - Frontend local development (gitignored)
- `.env.production` - Frontend production config (can include public API URL)

## 🔒 Security Best Practices

1. ✅ **Never commit secrets** - All API keys are in GitHub Secrets or `.env` (gitignored)
2. ✅ **Use minimal permissions** - Cloudflare API tokens should have only necessary scopes
3. ✅ **Rotate tokens regularly** - Update secrets periodically
4. ✅ **Monitor deployments** - Check GitHub Actions logs for any exposed secrets
5. ✅ **Use environment-specific keys** - Separate development and production API keys
6. ✅ **Review before public** - Ensure no secrets in code before making repository public

### How Secrets Are Protected

- **GitHub Secrets**: Encrypted at rest, only accessible during workflow runs
- **Worker Secrets**: Encrypted by Cloudflare, not accessible via API
- **Environment Variables**: Only public variables (like `NEXT_PUBLIC_API_URL`) are bundled
- **Git Ignore**: All `.env*` files are gitignored except `.env.example`

## 📚 Additional Resources

- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [Cloudflare Pages Docs](https://developers.cloudflare.com/pages/)
- [Wrangler CLI Docs](https://developers.cloudflare.com/workers/wrangler/)
- [GitHub Actions Docs](https://docs.github.com/en/actions)
- [Next.js Static Export](https://nextjs.org/docs/app/building-your-application/deploying/static-exports)
- [Cloudflare KV Storage](https://developers.cloudflare.com/kv/)

## 🆘 Getting Help

If you encounter issues:

1. Check the [Troubleshooting](#-troubleshooting) section above
2. Review GitHub Actions logs: `https://github.com/YOUR_USERNAME/iphey/actions`
3. Check Worker logs: `npm run worker:tail`
4. Open an issue on GitHub

## ✅ Quick Setup Checklist

Before deploying, make sure you have:

- [ ] Cloudflare account with API token
- [ ] IPInfo.io API token
- [ ] AbuseIPDB API key
- [ ] GitHub repository created
- [ ] All 6 GitHub Secrets configured:
  - [ ] CLOUDFLARE_API_TOKEN
  - [ ] CLOUDFLARE_ACCOUNT_ID
  - [ ] IPINFO_TOKEN
  - [ ] CLOUDFLARE_RADAR_TOKEN
  - [ ] ABUSEIPDB_API_KEY
  - [ ] NEXT_PUBLIC_API_URL
- [ ] Code pushed to `main` branch
- [ ] GitHub Actions workflow running successfully

Once all items are checked, your deployment should be live!
