#!/bin/bash
# 配置 Cloudflare Workers secrets

echo "🔐 IPhey - Cloudflare Workers Secrets 配置"
echo "=========================================="
echo ""

# 检查 wrangler 是否已安装
if ! command -v wrangler &> /dev/null; then
    echo "❌ wrangler 未安装"
    echo "运行: npm install -g wrangler"
    exit 1
fi

echo "✅ wrangler 已安装"
echo ""

# 检查是否已登录
echo "🔍 检查 Cloudflare 认证状态..."
if ! wrangler whoami &> /dev/null; then
    echo "⚠️  未登录 Cloudflare"
    echo "运行登录命令..."
    wrangler login
    
    if [ $? -ne 0 ]; then
        echo "❌ 登录失败"
        exit 1
    fi
fi

echo "✅ 已登录 Cloudflare"
echo ""

# 检查 .env 文件
if [ ! -f .env ]; then
    echo "⚠️  .env 文件不存在"
    echo "从模板创建 .env 文件..."
    cp .env.example .env
    echo "✅ 已创建 .env 文件"
    echo ""
    echo "⚠️  请编辑 .env 文件，填入你的新 API keys:"
    echo "   nano .env"
    echo ""
    read -p "按 Enter 继续..."
fi

echo "📋 需要配置的 secrets:"
echo "1. IPINFO_TOKEN - IPInfo.io API Token"
echo "2. CLOUDFLARE_ACCOUNT_ID - Cloudflare Account ID"
echo "3. CLOUDFLARE_RADAR_TOKEN - Cloudflare Radar API Token"
echo "4. ABUSEIPDB_API_KEY - AbuseIPDB API Key"
echo ""

read -p "开始配置 secrets? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "❌ 取消配置"
    exit 1
fi

echo ""
echo "🔐 配置 IPINFO_TOKEN..."
wrangler secret put IPINFO_TOKEN

echo ""
echo "🔐 配置 CLOUDFLARE_ACCOUNT_ID..."
wrangler secret put CLOUDFLARE_ACCOUNT_ID

echo ""
echo "🔐 配置 CLOUDFLARE_RADAR_TOKEN..."
wrangler secret put CLOUDFLARE_RADAR_TOKEN

echo ""
echo "🔐 配置 ABUSEIPDB_API_KEY..."
wrangler secret put ABUSEIPDB_API_KEY

echo ""
echo "✅ Secrets 配置完成！"
echo ""
echo "🔍 验证配置的 secrets:"
wrangler secret list

echo ""
echo "🎯 下一步:"
echo "1. 测试本地开发: npm run dev"
echo "2. 部署到生产: npm run deploy:worker"
echo "3. 验证部署: curl https://iphey-api.YOUR_SUBDOMAIN.workers.dev/api/health"
