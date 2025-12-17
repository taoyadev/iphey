#!/bin/bash
# 推送清理后的仓库到 GitHub

echo "🚀 准备推送清理后的仓库..."
echo ""
echo "⚠️  这将强制覆盖 GitHub 上的历史记录"
echo "   旧的包含泄漏 API keys 的历史将被删除"
echo ""

read -p "确认继续？(yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "❌ 取消推送"
    exit 1
fi

echo ""
echo "📋 当前 Git 历史："
git log --oneline

echo ""
echo "🔍 验证没有泄漏的 secrets..."
# Check for common secret patterns (tokens, api keys, etc.)
if grep -rE "(ghp_[a-zA-Z0-9]{36}|AKIA[0-9A-Z]{16}|[0-9a-f]{64})" . --exclude-dir=node_modules --exclude-dir=.git --exclude="*.sh" 2>/dev/null | grep -v "example\|template"; then
    echo "❌ 发现可能泄漏的 API keys！取消推送"
    exit 1
fi

echo "✅ 未发现泄漏的 secrets"
echo ""
echo "🚀 开始推送到 GitHub..."
git push -u --force origin main

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ 推送成功！"
    echo ""
    echo "🎯 下一步："
    echo "1. 立即撤销泄漏的 API keys："
    echo "   - IPInfo: https://ipinfo.io/account/token"
    echo "   - Cloudflare: https://dash.cloudflare.com/profile/api-tokens"
    echo "   - AbuseIPDB: https://www.abuseipdb.com/account/api"
    echo ""
    echo "2. 生成新的 API keys"
    echo ""
    echo "3. 运行: ./setup-secrets.sh 配置新的 secrets"
else
    echo ""
    echo "❌ 推送失败"
    echo ""
    echo "💡 请尝试："
    echo "1. 切换到 taoyadev 账号:"
    echo "   gh auth switch"
    echo ""
    echo "2. 或使用 SSH (需要配置 SSH key):"
    echo "   git remote set-url origin git@github.com:taoyadev/iphey.git"
    echo "   git push -u --force origin main"
    echo ""
    echo "3. 或手动推送:"
    echo "   在你的终端运行: git push -u --force origin main"
fi
