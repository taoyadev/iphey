#!/bin/bash
# 配置 GitHub Actions Secrets

echo "🔐 GitHub Actions Secrets 配置"
echo "=============================="
echo ""

# 检查 gh CLI
if ! command -v gh &> /dev/null; then
    echo "❌ GitHub CLI (gh) 未安装"
    echo "安装: brew install gh"
    exit 1
fi

echo "✅ GitHub CLI 已安装"
echo ""

# 检查认证
if ! gh auth status &> /dev/null; then
    echo "⚠️  未登录 GitHub"
    echo "运行登录..."
    gh auth login
    
    if [ $? -ne 0 ]; then
        echo "❌ 登录失败"
        exit 1
    fi
fi

echo "✅ 已登录 GitHub"
echo ""

# 检查仓库
REPO="taoyadev/iphey"
echo "📦 目标仓库: $REPO"
echo ""

# 从 .env 读取值（如果存在）
if [ -f .env ]; then
    echo "✅ 找到 .env 文件"
    source .env
else
    echo "⚠️  未找到 .env 文件"
    echo "请先配置 .env 文件: cp .env.example .env"
    exit 1
fi

echo ""
echo "📋 将配置以下 secrets:"
echo "1. CLOUDFLARE_API_TOKEN"
echo "2. CLOUDFLARE_ACCOUNT_ID"
echo "3. IPINFO_TOKEN"
echo "4. CLOUDFLARE_RADAR_TOKEN"
echo "5. ABUSEIPDB_API_KEY"
echo "6. NEXT_PUBLIC_API_URL"
echo ""

read -p "开始配置? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "❌ 取消配置"
    exit 1
fi

echo ""

# 配置 CLOUDFLARE_API_TOKEN
if [ -z "$CLOUDFLARE_RADAR_TOKEN" ]; then
    echo "⚠️  CLOUDFLARE_RADAR_TOKEN 未设置"
    read -p "请输入 Cloudflare API Token: " CLOUDFLARE_API_TOKEN
else
    CLOUDFLARE_API_TOKEN="$CLOUDFLARE_RADAR_TOKEN"
fi

echo "🔐 设置 CLOUDFLARE_API_TOKEN..."
echo "$CLOUDFLARE_API_TOKEN" | gh secret set CLOUDFLARE_API_TOKEN -R "$REPO"

# 配置 CLOUDFLARE_ACCOUNT_ID
if [ -z "$CLOUDFLARE_ACCOUNT_ID" ]; then
    echo "⚠️  CLOUDFLARE_ACCOUNT_ID 未设置"
    read -p "请输入 Cloudflare Account ID: " CLOUDFLARE_ACCOUNT_ID
fi

echo "🔐 设置 CLOUDFLARE_ACCOUNT_ID..."
echo "$CLOUDFLARE_ACCOUNT_ID" | gh secret set CLOUDFLARE_ACCOUNT_ID -R "$REPO"

# 配置 IPINFO_TOKEN
if [ -z "$IPINFO_TOKEN" ]; then
    echo "⚠️  IPINFO_TOKEN 未设置"
    read -p "请输入 IPInfo Token: " IPINFO_TOKEN
fi

echo "🔐 设置 IPINFO_TOKEN..."
echo "$IPINFO_TOKEN" | gh secret set IPINFO_TOKEN -R "$REPO"

# 配置 CLOUDFLARE_RADAR_TOKEN
if [ -z "$CLOUDFLARE_RADAR_TOKEN" ]; then
    echo "⚠️  CLOUDFLARE_RADAR_TOKEN 未设置"
    read -p "请输入 Cloudflare Radar Token: " CLOUDFLARE_RADAR_TOKEN
fi

echo "🔐 设置 CLOUDFLARE_RADAR_TOKEN..."
echo "$CLOUDFLARE_RADAR_TOKEN" | gh secret set CLOUDFLARE_RADAR_TOKEN -R "$REPO"

# 配置 ABUSEIPDB_API_KEY
if [ -z "$ABUSEIPDB_API_KEY" ]; then
    echo "⚠️  ABUSEIPDB_API_KEY 未设置"
    read -p "请输入 AbuseIPDB API Key: " ABUSEIPDB_API_KEY
fi

echo "🔐 设置 ABUSEIPDB_API_KEY..."
echo "$ABUSEIPDB_API_KEY" | gh secret set ABUSEIPDB_API_KEY -R "$REPO"

# 配置 NEXT_PUBLIC_API_URL
if [ -z "$NEXT_PUBLIC_API_URL" ]; then
    echo "⚠️  NEXT_PUBLIC_API_URL 未设置"
    read -p "请输入 API URL (例如 https://iphey-api.YOUR_SUBDOMAIN.workers.dev): " NEXT_PUBLIC_API_URL
fi

echo "🔐 设置 NEXT_PUBLIC_API_URL..."
echo "$NEXT_PUBLIC_API_URL" | gh secret set NEXT_PUBLIC_API_URL -R "$REPO"

echo ""
echo "✅ Secrets 配置完成！"
echo ""
echo "🔍 验证配置的 secrets:"
gh secret list -R "$REPO"

echo ""
echo "🎯 下一步:"
echo "1. 推送代码触发自动部署: git push origin main"
echo "2. 或访问 Actions 页面手动触发: https://github.com/$REPO/actions"
