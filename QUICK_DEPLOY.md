# 🚀 Quick Deploy Guide

## Step 1: Set GitHub Secrets

Visit: https://github.com/taoyadev/iphey/settings/secrets/actions

Add these 6 secrets (click "New repository secret" for each):

| Name | Value |
|------|-------|
| CLOUDFLARE_API_TOKEN | See SECRETS_TO_SET.md |
| CLOUDFLARE_ACCOUNT_ID | See SECRETS_TO_SET.md |
| CLOUDFLARE_RADAR_TOKEN | See SECRETS_TO_SET.md |
| IPINFO_TOKEN | See SECRETS_TO_SET.md |
| ABUSEIPDB_API_KEY | See SECRETS_TO_SET.md |
| NEXT_PUBLIC_API_URL | `https://iphey-api.difft.workers.dev` |

## Step 2: Deploy

After setting secrets, run:

```bash
git add .
git commit -m "feat: Secure Cloudflare deployment with Worker + Pages"
git push origin main
```

## Step 3: Monitor Deployment

- GitHub Actions: https://github.com/taoyadev/iphey/actions
- Cloudflare Dashboard: https://dash.cloudflare.com/

## Expected Results

- Backend API: https://iphey-api.difft.workers.dev/api/v1/services/status
- Frontend: https://iphey.pages.dev

Deployment usually takes 2-5 minutes.
