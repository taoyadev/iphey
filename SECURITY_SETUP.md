# 🔒 Security Setup Guide

## Emergency Cleanup Summary

✅ **Completed Actions:**
- Removed all leaked API keys from tracked files
- Nuked entire git history
- Created fresh initial commit without secrets
- Repository ready for secure deployment

## Step 1: Generate New API Keys

### 1.1 IPInfo.io Token
1. Visit: https://ipinfo.io/account/token
2. **Revoke old token** ending in `...9bda56` (if not done already)
3. Create new token: Click "Create Token" → Copy the new token

### 1.2 Cloudflare Radar Token
1. Visit: https://dash.cloudflare.com/profile/api-tokens
2. **Revoke old token** ending in `...JAtt8` (if not done already)
3. Create new API Token:
   - Click "Create Token"
   - Use "Read Radar" template or custom with:
     - Account → Radar (Read)
   - Copy the new token

### 1.3 AbuseIPDB API Key
1. Visit: https://www.abuseipdb.com/account/api
2. **Delete old key** (if not done already)
3. Generate new key: Click "Create Key" → Copy

### 1.4 Cloudflare Account ID
1. Visit: https://dash.cloudflare.com/
2. Select your account
3. Copy "Account ID" from the right sidebar

## Step 2: Configure Local Development

Create `.env` file (gitignored):

```bash
cp .env.example .env
```

Edit `.env` with your NEW keys:
```bash
IPINFO_TOKEN=<paste_new_token>
CLOUDFLARE_ACCOUNT_ID=<paste_account_id>
CLOUDFLARE_RADAR_TOKEN=<paste_new_token>
ABUSEIPDB_API_KEY=<paste_new_key>
```

Test local server:
```bash
npm install
npm run dev
```

## Step 3: Configure Cloudflare Workers Secrets

**NEVER commit secrets to wrangler.toml!**

Set secrets using wrangler CLI:

```bash
# Authenticate with Cloudflare (first time only)
npx wrangler login

# Set each secret securely
npx wrangler secret put IPINFO_TOKEN
# Paste your new IPInfo token when prompted

npx wrangler secret put CLOUDFLARE_ACCOUNT_ID
# Paste your Cloudflare account ID

npx wrangler secret put CLOUDFLARE_RADAR_TOKEN
# Paste your new Cloudflare Radar token

npx wrangler secret put ABUSEIPDB_API_KEY
# Paste your new AbuseIPDB key

# Verify secrets are set
npx wrangler secret list
```

## Step 4: Configure GitHub Actions Secrets

For CI/CD deployment, add secrets to GitHub:

1. Go to: https://github.com/taoyadev/iphey/settings/secrets/actions
2. Click "New repository secret" for each:

| Secret Name | Value |
|------------|-------|
| `CLOUDFLARE_API_TOKEN` | Your Cloudflare API Token (from Step 1.2) |
| `CLOUDFLARE_ACCOUNT_ID` | Your Account ID (from Step 1.4) |
| `IPINFO_TOKEN` | Your new IPInfo token (from Step 1.1) |
| `CLOUDFLARE_RADAR_TOKEN` | Same as CLOUDFLARE_API_TOKEN |
| `ABUSEIPDB_API_KEY` | Your new AbuseIPDB key (from Step 1.3) |
| `NEXT_PUBLIC_API_URL` | `https://iphey-api.YOUR_SUBDOMAIN.workers.dev` |

## Step 5: Deploy to Production

### Manual Deployment
```bash
# Deploy backend (Cloudflare Worker)
npm run deploy:worker

# Deploy frontend (Cloudflare Pages)
npm run deploy:pages
```

### Automatic Deployment
Push to main branch:
```bash
git add .
git commit -m "chore: Update configuration"
git push origin main
```

GitHub Actions will automatically deploy both backend and frontend.

## Step 6: Verify Deployment

Test production API:
```bash
# Health check
curl https://iphey-api.YOUR_SUBDOMAIN.workers.dev/api/health

# IP lookup test
curl https://iphey-api.YOUR_SUBDOMAIN.workers.dev/api/ip/8.8.8.8
```

## Security Checklist

- [ ] All old API keys revoked from providers
- [ ] New API keys generated
- [ ] `.env` file created locally (NOT committed)
- [ ] Wrangler secrets configured (`wrangler secret list` shows all 4)
- [ ] GitHub Actions secrets configured
- [ ] Git history cleaned (force pushed to GitHub)
- [ ] Local dev server works (`npm run dev`)
- [ ] Production deployment works
- [ ] Old keys monitored for suspicious activity

## Prevention for Future

### Pre-Commit Hook
The repository has a pre-commit hook that scans for secrets. Keep it enabled:

```bash
# Ensure git hooks are installed
chmod +x .husky/pre-commit
```

### Files That Should NEVER Be Committed
- `.env`
- `.env.local`
- `.env.*.local`
- `.deploy.env`
- `wrangler.toml` (if it contains secrets in [vars] section)

### Safe Configuration Pattern
✅ **DO:** Use `wrangler secret put` for sensitive values
✅ **DO:** Use GitHub Actions secrets for CI/CD
✅ **DO:** Keep secrets in `.env` (gitignored)

❌ **DON'T:** Put secrets in `wrangler.toml` [vars] section
❌ **DON'T:** Commit `.env` files
❌ **DON'T:** Hardcode API keys in source code

## Monitoring

### Check for Suspicious Activity
1. **IPInfo**: Monitor usage at https://ipinfo.io/account/usage
2. **Cloudflare**: Check logs at https://dash.cloudflare.com/
3. **AbuseIPDB**: Monitor at https://www.abuseipdb.com/account/api

If you notice unexpected usage, immediately revoke keys and rotate.

## Emergency Contact

If you discover another leak:
1. Immediately revoke all affected keys
2. Generate new keys
3. Update all environments (local, wrangler, GitHub)
4. Audit git history: `git log -S "API_KEY" --all --patch`

---

**Last Updated:** 2025-12-17
**Status:** All leaked keys removed from git history ✅
