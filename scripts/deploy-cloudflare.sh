#!/bin/bash

# Cloudflare Workers 部署脚本
# 自动化设置 KV 和部署 Worker

set -e  # Exit on error

echo "🚀 IPhey Cloudflare Workers 部署脚本"
echo "======================================"
echo ""

# 颜色定义
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 检查 wrangler 是否安装
if ! command -v wrangler &> /dev/null; then
    echo -e "${RED}❌ Wrangler CLI 未安装${NC}"
    echo "请运行: npm install -g wrangler"
    exit 1
fi

echo -e "${GREEN}✅ Wrangler CLI 已安装${NC}"

# 检查是否已登录
if ! wrangler whoami &> /dev/null; then
    echo -e "${YELLOW}⚠️  请先登录 Cloudflare${NC}"
    wrangler login
fi

echo -e "${GREEN}✅ 已登录 Cloudflare${NC}"
echo ""

# 步骤 1: 创建 KV Namespace (如果不存在)
echo -e "${BLUE}📦 步骤 1/5: 创建 KV Namespace${NC}"
echo "运行: npm run kv:create"
echo ""
echo -e "${YELLOW}请复制生成的 KV ID 并更新 wrangler.toml 中的:${NC}"
echo "  - id (生产环境)"
echo "  - preview_id (预览环境)"
echo ""
read -p "已经创建好 KV 并更新了 wrangler.toml 吗? (y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "请先运行: npm run kv:create"
    echo "然后更新 wrangler.toml"
    exit 1
fi

echo -e "${GREEN}✅ KV Namespace 配置完成${NC}"
echo ""

# 步骤 2: 设置 Secrets
echo -e "${BLUE}🔐 步骤 2/5: 设置 Secrets${NC}"
echo "需要设置以下 secrets:"
echo "  1. IPINFO_TOKEN (必需)"
echo "  2. CLOUDFLARE_ACCOUNT_ID (可选)"
echo "  3. CLOUDFLARE_RADAR_TOKEN (可选)"
echo ""
read -p "是否现在设置 secrets? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "设置 IPINFO_TOKEN:"
    wrangler secret put IPINFO_TOKEN

    read -p "是否设置 Cloudflare Radar tokens? (y/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "设置 CLOUDFLARE_ACCOUNT_ID:"
        wrangler secret put CLOUDFLARE_ACCOUNT_ID
        echo "设置 CLOUDFLARE_RADAR_TOKEN:"
        wrangler secret put CLOUDFLARE_RADAR_TOKEN
    fi
fi

echo -e "${GREEN}✅ Secrets 配置完成${NC}"
echo ""

# 步骤 3: 构建项目
echo -e "${BLUE}🔨 步骤 3/5: 构建项目${NC}"
npm run build:worker

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ 构建成功${NC}"
else
    echo -e "${RED}❌ 构建失败${NC}"
    exit 1
fi
echo ""

# 步骤 4: 部署到 Cloudflare
echo -e "${BLUE}🚀 步骤 4/5: 部署到 Cloudflare${NC}"
read -p "确认部署到生产环境? (y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "取消部署"
    exit 0
fi

wrangler deploy

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ 部署成功!${NC}"
else
    echo -e "${RED}❌ 部署失败${NC}"
    exit 1
fi
echo ""

# 步骤 5: 测试部署
echo -e "${BLUE}🧪 步骤 5/5: 测试部署${NC}"
WORKER_URL=$(wrangler deployments list --json | jq -r '.[0].url' 2>/dev/null || echo "")

if [ -z "$WORKER_URL" ]; then
    echo -e "${YELLOW}⚠️  无法自动获取 Worker URL${NC}"
    echo "请在 Cloudflare Dashboard 中查看"
else
    echo "测试健康检查端点..."
    curl -s "$WORKER_URL/api/health" | jq . || echo "请求失败"
fi
echo ""

# 完成
echo -e "${GREEN}======================================"
echo "🎉 部署完成!"
echo "======================================${NC}"
echo ""
echo "下一步:"
echo "  1. 查看日志: npm run worker:tail"
echo "  2. 测试 API: curl https://你的域名/api/health"
echo "  3. 部署前端到 Cloudflare Pages"
echo ""
echo "相关命令:"
echo "  - wrangler tail              # 实时日志"
echo "  - wrangler deployments list  # 查看部署历史"
echo "  - wrangler kv:key list       # 查看 KV 数据"
echo ""
