# ✅ 安全清理行动清单

## 🎯 当前状态
- ✅ 所有泄漏的 secrets 已从文件中删除
- ✅ Git 历史已完全清除
- ✅ 新的干净的 Git 历史已创建（仅 2 个提交）
- ✅ 安全文档和配置脚本已创建
- ⏳ 等待推送到 GitHub
- ⚠️ **泄漏的 API keys 仍然有效，需要立即撤销！**

---

## 📋 必须立即执行的步骤

### ✅ 步骤 1: 推送清理后的代码到 GitHub

**方法 A: 使用自动脚本（推荐）**
```bash
./push-to-github.sh
```

**方法 B: 手动推送**
```bash
# 如果需要切换 GitHub 账号
gh auth switch

# 推送
git push -u --force origin main
```

**验证推送成功:**
访问: https://github.com/taoyadev/iphey/commits/main
应该只看到 2 个提交，没有旧历史

---

### 🚨 步骤 2: 立即撤销泄漏的 API Keys（最高优先级！）

#### 2.1 IPInfo Token
- 🔗 **链接**: https://ipinfo.io/account/token
- ❌ **撤销**: Token 结尾为 `...9bda56`
- 🔄 **操作**: 点击 Delete/Revoke

#### 2.2 Cloudflare Radar Token
- 🔗 **链接**: https://dash.cloudflare.com/profile/api-tokens
- ❌ **撤销**: Token 结尾为 `...JAtt8`
- 🔄 **操作**: 点击 Revoke

#### 2.3 AbuseIPDB API Key
- 🔗 **链接**: https://www.abuseipdb.com/account/api
- ❌ **删除**: 泄漏的 key
- 🔄 **操作**: Delete Key

**⏰ 时间要求: 立即执行！越快越好！**

---

### 🔑 步骤 3: 生成新的 API Keys

#### 3.1 IPInfo Token
1. 访问: https://ipinfo.io/account/token
2. 点击 "Create Token"
3. 复制新 token → 保存到密码管理器

#### 3.2 Cloudflare Radar Token
1. 访问: https://dash.cloudflare.com/profile/api-tokens
2. 点击 "Create Token"
3. 选择模板: "Read Radar" 或自定义权限
4. 复制 token → 保存到密码管理器

#### 3.3 AbuseIPDB API Key
1. 访问: https://www.abuseipdb.com/account/api
2. 点击 "Create Key"
3. 复制 key → 保存到密码管理器

#### 3.4 Cloudflare Account ID
1. 访问: https://dash.cloudflare.com/
2. 选择你的账号
3. 从右侧边栏复制 "Account ID"

---

### ⚙️ 步骤 4: 配置本地开发环境

#### 4.1 创建 .env 文件
```bash
cp .env.example .env
nano .env  # 或使用你喜欢的编辑器
```

#### 4.2 填入新的 API keys
```bash
IPINFO_TOKEN=<粘贴你的新 IPInfo token>
CLOUDFLARE_ACCOUNT_ID=<粘贴你的 Account ID>
CLOUDFLARE_RADAR_TOKEN=<粘贴你的新 Radar token>
ABUSEIPDB_API_KEY=<粘贴你的新 AbuseIPDB key>
```

#### 4.3 测试本地服务器
```bash
npm install
npm run dev
```

访问: http://localhost:4310/api/health

---

### 🔐 步骤 5: 配置 Cloudflare Workers Secrets

**方法 A: 使用自动脚本（推荐）**
```bash
./setup-secrets.sh
```

**方法 B: 手动配置**
```bash
# 登录 Cloudflare
wrangler login

# 逐个设置 secrets
wrangler secret put IPINFO_TOKEN
wrangler secret put CLOUDFLARE_ACCOUNT_ID
wrangler secret put CLOUDFLARE_RADAR_TOKEN
wrangler secret put ABUSEIPDB_API_KEY

# 验证
wrangler secret list
```

---

### 🎬 步骤 6: 配置 GitHub Actions Secrets

#### 6.1 访问仓库设置
🔗 https://github.com/taoyadev/iphey/settings/secrets/actions

#### 6.2 添加以下 secrets（点击 "New repository secret"）

| Secret Name | Value | 来源 |
|------------|-------|------|
| `CLOUDFLARE_API_TOKEN` | 你的 Cloudflare Radar Token | 步骤 3.2 |
| `CLOUDFLARE_ACCOUNT_ID` | 你的 Account ID | 步骤 3.4 |
| `IPINFO_TOKEN` | 你的 IPInfo Token | 步骤 3.1 |
| `CLOUDFLARE_RADAR_TOKEN` | 同 CLOUDFLARE_API_TOKEN | 步骤 3.2 |
| `ABUSEIPDB_API_KEY` | 你的 AbuseIPDB Key | 步骤 3.3 |
| `NEXT_PUBLIC_API_URL` | `https://iphey-api.YOUR_SUBDOMAIN.workers.dev` | 你的 Worker URL |

#### 6.3 验证 secrets
```bash
gh secret list
```

应该看到 6 个 secrets

---

### 🚀 步骤 7: 部署到生产环境

#### 7.1 部署 Backend (Cloudflare Worker)
```bash
npm run deploy:worker
# 或
wrangler deploy
```

#### 7.2 部署 Frontend (Cloudflare Pages)
```bash
cd apps/web-next
npm run build
wrangler pages deploy dist
```

#### 7.3 或使用 GitHub Actions 自动部署
```bash
git add .
git commit -m "chore: Update configuration"
git push origin main
```

---

### ✅ 步骤 8: 验证部署成功

#### 8.1 测试 API Health
```bash
curl https://iphey-api.YOUR_SUBDOMAIN.workers.dev/api/health
```

应该返回:
```json
{
  "status": "healthy",
  "timestamp": "...",
  "dependencies": {...}
}
```

#### 8.2 测试 IP Lookup
```bash
curl https://iphey-api.YOUR_SUBDOMAIN.workers.dev/api/ip/8.8.8.8
```

应该返回 IP 信息

#### 8.3 访问前端
打开浏览器访问你的 Cloudflare Pages URL

---

## 📊 进度跟踪

| 步骤 | 任务 | 状态 | 备注 |
|-----|------|------|------|
| 1 | 推送到 GitHub | ⏳ 待执行 | 运行 `./push-to-github.sh` |
| 2 | 撤销 IPInfo key | ⚠️ 紧急 | https://ipinfo.io/account/token |
| 2 | 撤销 Cloudflare key | ⚠️ 紧急 | https://dash.cloudflare.com/profile/api-tokens |
| 2 | 撤销 AbuseIPDB key | ⚠️ 紧急 | https://www.abuseipdb.com/account/api |
| 3 | 生成新 keys | ⏳ 待执行 | 保存到密码管理器 |
| 4 | 配置本地 .env | ⏳ 待执行 | `cp .env.example .env` |
| 5 | 配置 Wrangler secrets | ⏳ 待执行 | 运行 `./setup-secrets.sh` |
| 6 | 配置 GitHub secrets | ⏳ 待执行 | 在仓库设置中添加 |
| 7 | 部署到生产 | ⏳ 待执行 | `npm run deploy:worker` |
| 8 | 验证部署 | ⏳ 待执行 | 测试 API endpoints |

---

## 🛠️ 可用的脚本和工具

| 脚本 | 用途 | 命令 |
|-----|------|------|
| `push-to-github.sh` | 推送清理后的代码到 GitHub | `./push-to-github.sh` |
| `setup-secrets.sh` | 配置 Cloudflare Workers secrets | `./setup-secrets.sh` |
| `.env.example` | 环境变量模板 | `cp .env.example .env` |
| `SECURITY_SETUP.md` | 完整安全设置指南 | `cat SECURITY_SETUP.md` |
| `QUICK_START.md` | 5 分钟快速开始指南 | `cat QUICK_START.md` |

---

## 📞 需要帮助？

### 常见问题

**Q: 推送到 GitHub 失败怎么办？**
A: 
1. 切换 GitHub 账号: `gh auth switch`
2. 或使用 SSH: `git remote set-url origin git@github.com:taoyadev/iphey.git`
3. 或手动在终端推送

**Q: Wrangler 登录失败？**
A: 运行 `wrangler login` 并在浏览器中完成授权

**Q: 如何验证 secrets 已正确配置？**
A: 运行 `wrangler secret list` 查看已配置的 secrets

**Q: 部署后 API 返回错误？**
A: 
1. 检查 Wrangler secrets 是否都已设置
2. 查看 Worker 日志: `wrangler tail`
3. 验证 API keys 是否有效

**Q: 如何监控是否有人使用泄漏的 keys？**
A:
- IPInfo: https://ipinfo.io/account/usage
- Cloudflare: https://dash.cloudflare.com/ (Analytics)
- AbuseIPDB: https://www.abuseipdb.com/account/api

---

## ⏰ 时间线建议

| 时间 | 任务 | 重要性 |
|-----|------|--------|
| **现在** | 推送到 GitHub | 🔴 高 |
| **现在** | 撤销所有泄漏的 keys | 🔴 紧急 |
| **5 分钟内** | 生成新 keys | 🟡 中 |
| **10 分钟内** | 配置本地 .env | 🟡 中 |
| **15 分钟内** | 配置 Wrangler secrets | 🟡 中 |
| **20 分钟内** | 配置 GitHub secrets | 🟢 低 |
| **25 分钟内** | 部署并验证 | 🟢 低 |

---

**最后更新**: 2025-12-17
**状态**: 等待用户执行推送和 key 撤销 ⚠️
