#!/bin/bash
set -e

echo "🚀 IPhey Deployment Setup Script"
echo "=================================="
echo "This script will configure GitHub Secrets for deploying IPhey to Cloudflare"
echo ""

# Check if .deploy.env exists
if [ ! -f .deploy.env ]; then
    echo "❌ Error: .deploy.env file not found"
    echo "📝 Please copy .deploy.env.example to .deploy.env and fill in your credentials"
    echo ""
    echo "   cp .deploy.env.example .deploy.env"
    echo "   # Then edit .deploy.env with your actual credentials"
    exit 1
fi

# Load environment variables from .deploy.env
echo "📥 Loading credentials from .deploy.env..."
export $(cat .deploy.env | grep -v '^#' | grep -v '^$' | xargs)

# Validate required variables
REQUIRED_VARS=(
    "CLOUDFLARE_API_TOKEN"
    "CLOUDFLARE_ACCOUNT_ID"
    "IPINFO_TOKEN"
    "ABUSEIPDB_API_KEY"
)

MISSING_VARS=()
for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var}" ]; then
        MISSING_VARS+=("$var")
    fi
done

if [ ${#MISSING_VARS[@]} -gt 0 ]; then
    echo "❌ Error: Missing required environment variables:"
    for var in "${MISSING_VARS[@]}"; do
        echo "   - $var"
    done
    echo ""
    echo "Please ensure all required variables are set in .deploy.env"
    exit 1
fi

# Check if gh CLI is installed and logged in
if ! command -v gh &> /dev/null; then
    echo "❌ Error: GitHub CLI (gh) is not installed"
    echo "   Install it from: https://cli.github.com/"
    exit 1
fi

# Get GitHub username
GITHUB_USERNAME=$(gh api user -q .login 2>/dev/null || echo "")
if [ -z "$GITHUB_USERNAME" ]; then
    echo "❌ Error: Unable to get GitHub username. Please ensure you're logged in with 'gh auth login'"
    exit 1
fi

echo "✅ GitHub username: $GITHUB_USERNAME"
echo ""

# Check if repo already exists on GitHub
REPO_NAME="iphey"
REPO_EXISTS=$(gh repo view "$GITHUB_USERNAME/$REPO_NAME" --json name -q .name 2>/dev/null || echo "")

if [ -z "$REPO_EXISTS" ]; then
    echo "📦 Creating GitHub repository: $GITHUB_USERNAME/$REPO_NAME (public)..."
    gh repo create "$REPO_NAME" --public --source=. --remote=origin --description="IPhey - Browser Fingerprint & Digital Identity Inspector"
    echo "✅ Repository created"
else
    echo "✅ Repository already exists: $GITHUB_USERNAME/$REPO_NAME"
    # Add remote if not exists
    if ! git remote get-url origin &> /dev/null; then
        git remote add origin "https://github.com/$GITHUB_USERNAME/$REPO_NAME.git"
    fi
fi

echo ""

# Set GitHub secrets
echo "🔐 Setting GitHub secrets..."
echo ""

# Cloudflare credentials
gh secret set CLOUDFLARE_API_TOKEN --body "$CLOUDFLARE_API_TOKEN" --repo "$GITHUB_USERNAME/$REPO_NAME"
echo "✅ CLOUDFLARE_API_TOKEN set"

gh secret set CLOUDFLARE_ACCOUNT_ID --body "$CLOUDFLARE_ACCOUNT_ID" --repo "$GITHUB_USERNAME/$REPO_NAME"
echo "✅ CLOUDFLARE_ACCOUNT_ID set"

# Third-party API keys
gh secret set IPINFO_TOKEN --body "$IPINFO_TOKEN" --repo "$GITHUB_USERNAME/$REPO_NAME"
echo "✅ IPINFO_TOKEN set"

# Use CLOUDFLARE_API_TOKEN for CLOUDFLARE_RADAR_TOKEN if not provided
if [ -z "$CLOUDFLARE_RADAR_TOKEN" ]; then
    CLOUDFLARE_RADAR_TOKEN="$CLOUDFLARE_API_TOKEN"
fi
gh secret set CLOUDFLARE_RADAR_TOKEN --body "$CLOUDFLARE_RADAR_TOKEN" --repo "$GITHUB_USERNAME/$REPO_NAME"
echo "✅ CLOUDFLARE_RADAR_TOKEN set"

gh secret set ABUSEIPDB_API_KEY --body "$ABUSEIPDB_API_KEY" --repo "$GITHUB_USERNAME/$REPO_NAME"
echo "✅ ABUSEIPDB_API_KEY set"

# Set NEXT_PUBLIC_API_URL (default to Worker URL if not provided)
if [ -z "$NEXT_PUBLIC_API_URL" ]; then
    NEXT_PUBLIC_API_URL="https://iphey-api.difft.workers.dev"
fi
gh secret set NEXT_PUBLIC_API_URL --body "$NEXT_PUBLIC_API_URL" --repo "$GITHUB_USERNAME/$REPO_NAME"
echo "✅ NEXT_PUBLIC_API_URL set"

echo ""
echo "🎯 Verifying secrets..."
gh secret list --repo "$GITHUB_USERNAME/$REPO_NAME"

echo ""
echo "🎯 Committing and pushing code..."

# Add all files
git add .

# Create initial commit if no commits yet
if ! git rev-parse HEAD &> /dev/null; then
    git commit --no-verify -m "Initial commit: IPhey - Browser Fingerprint & Digital Identity Inspector

- Backend API (Cloudflare Worker) with IP intelligence
- Frontend SPA (Next.js) with interactive dashboard
- IP geolocation, threat intelligence, ASN analysis
- Cloudflare Pages + Workers deployment configured
- GitHub Actions CI/CD with secure secret management"
    echo "✅ Initial commit created"
else
    # Check if there are changes to commit
    if ! git diff-index --quiet HEAD --; then
        git commit --no-verify -m "Update deployment configuration and secrets"
        echo "✅ Changes committed"
    else
        echo "ℹ️  No changes to commit"
    fi
fi

# Push to GitHub
echo "📤 Pushing to GitHub..."
git push -u origin main
echo "✅ Code pushed to GitHub"

echo ""
echo "🎉 Deployment setup complete!"
echo ""
echo "📋 Next steps:"
echo "   1. Visit https://github.com/$GITHUB_USERNAME/$REPO_NAME"
echo "   2. Go to Actions tab to see the deployment workflow"
echo "   3. Wait for deployment to complete (usually 2-5 minutes)"
echo ""
echo "🌐 Your services will be available at:"
echo "   Backend API: https://iphey-api.difft.workers.dev/api/v1/services/status"
echo "   Frontend:    https://iphey.pages.dev (or your custom domain)"
echo ""
echo "🔍 Monitor deployment:"
echo "   GitHub Actions: https://github.com/$GITHUB_USERNAME/$REPO_NAME/actions"
echo "   Cloudflare:     https://dash.cloudflare.com/"
echo ""
