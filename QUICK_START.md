# 🚀 Quick Start - Post-Security-Cleanup

## What Just Happened?
✅ All leaked API keys removed from git history
✅ Repository cleaned and ready for secure deployment
✅ Fresh git history created

## Next Steps (5 minutes)

### 1. Force Push Clean History to GitHub
```bash
cd /Volumes/SSD/dev/new/ip-dataset/iphey
git push -u --force origin main
```

If SSH permission denied:
- Add your SSH key at: https://github.com/settings/keys
- Or use HTTPS with personal access token

### 2. Revoke Old Keys (CRITICAL!)

| Provider | Action | URL |
|----------|--------|-----|
| IPInfo | Revoke token `...9bda56` | https://ipinfo.io/account/token |
| Cloudflare Radar | Revoke token `...JAtt8` | https://dash.cloudflare.com/profile/api-tokens |
| AbuseIPDB | Delete old key | https://www.abuseipdb.com/account/api |

### 3. Generate New Keys

1. **IPInfo**: https://ipinfo.io/account/token → Create Token
2. **Cloudflare Radar**: https://dash.cloudflare.com/profile/api-tokens → Create Token (Read Radar)
3. **AbuseIPDB**: https://www.abuseipdb.com/account/api → Create Key
4. **Cloudflare Account ID**: https://dash.cloudflare.com/ → Copy from sidebar

### 4. Configure Local Development
```bash
cp .env.example .env
# Edit .env with your NEW keys
nano .env

# Test local server
npm install
npm run dev
```

### 5. Configure Cloudflare Workers
```bash
npx wrangler login
npx wrangler secret put IPINFO_TOKEN
npx wrangler secret put CLOUDFLARE_ACCOUNT_ID
npx wrangler secret put CLOUDFLARE_RADAR_TOKEN
npx wrangler secret put ABUSEIPDB_API_KEY
npx wrangler secret list  # Verify
```

### 6. Configure GitHub Actions

Add secrets at: https://github.com/taoyadev/iphey/settings/secrets/actions

Required secrets:
- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`
- `IPINFO_TOKEN`
- `CLOUDFLARE_RADAR_TOKEN`
- `ABUSEIPDB_API_KEY`
- `NEXT_PUBLIC_API_URL`

### 7. Deploy
```bash
# Push to trigger automatic deployment
git push origin main

# Or deploy manually
npm run deploy:worker
npm run deploy:pages
```

## Files Created

- `SECURITY_SETUP.md` - Full security setup guide
- `QUICK_START.md` - This file
- `.env.example` - Environment template

## Need Help?

- **Full guide**: See `SECURITY_SETUP.md`
- **Deployment**: See `DEPLOYMENT.md`
- **Questions**: Open an issue

---

**Status**: Git history cleaned ✅ | Keys need rotation ⚠️ | Ready for deployment 🚀
