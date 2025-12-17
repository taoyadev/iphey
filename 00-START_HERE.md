# 🚨 IPhey 安全事件 - 完整解决方案

## 📊 当前状态 (2025-12-17)

### ✅ 已完成的工作

| 任务 | 状态 | 说明 |
|-----|------|------|
| 🔍 识别泄漏 | ✅ 完成 | 发现 3 个 API keys 在 commit 7ee6612 中泄漏 |
| 🧹 清理文件 | ✅ 完成 | 所有 tracked 文件已清理 |
| 💣 清除历史 | ✅ 完成 | Git 历史已完全重置（20+ commits → 3 commits） |
| 📝 创建文档 | ✅ 完成 | 7 个文档和脚本已创建 |
| 🤖 自动化脚本 | ✅ 完成 | 3 个自动化脚本可用 |

### ⚠️ 需要你执行的任务

| 优先级 | 任务 | 预计时间 | 脚本/链接 |
|--------|------|---------|----------|
| 🔴 **紧急** | 推送到 GitHub | 1 分钟 | `./push-to-github.sh` |
| 🔴 **紧急** | 撤销 IPInfo key | 1 分钟 | https://ipinfo.io/account/token |
| 🔴 **紧急** | 撤销 Cloudflare key | 1 分钟 | https://dash.cloudflare.com/profile/api-tokens |
| 🔴 **紧急** | 撤销 AbuseIPDB key | 1 分钟 | https://www.abuseipdb.com/account/api |
| 🟡 重要 | 生成新 keys | 5 分钟 | 见下方链接 |
| 🟡 重要 | 配置 Wrangler | 3 分钟 | `./setup-secrets.sh` |
| 🟢 常规 | 配置 GitHub Actions | 3 分钟 | `./setup-github-secrets.sh` |
| 🟢 常规 | 部署验证 | 2 分钟 | `npm run deploy:worker` |

---

## 🚀 快速开始 (5 分钟)

### 第 1 步: 推送清理后的代码 (1 分钟)

```bash
# 运行自动脚本
./push-to-github.sh

# 或者手动推送
git push -u --force origin main
```

**验证**: 访问 https://github.com/taoyadev/iphey/commits/main
应该只看到 3 个提交（没有旧历史）

---

### 第 2 步: 立即撤销泄漏的 Keys (3 分钟) 🚨

#### IPInfo
1. 🔗 访问: https://ipinfo.io/account/token
2. 找到 token 结尾为 `...9bda56`
3. 点击 **Delete** 或 **Revoke**

#### Cloudflare Radar
1. 🔗 访问: https://dash.cloudflare.com/profile/api-tokens
2. 找到 token 结尾为 `...JAtt8`
3. 点击 **Revoke**

#### AbuseIPDB
1. 🔗 访问: https://www.abuseipdb.com/account/api
2. 找到泄漏的 key
3. 点击 **Delete Key**

---

### 第 3 步: 生成新 Keys (5 分钟)

| Provider | 链接 | 操作 |
|----------|------|------|
| **IPInfo** | https://ipinfo.io/account/token | Create Token → 复制 |
| **Cloudflare Radar** | https://dash.cloudflare.com/profile/api-tokens | Create Token (Read Radar) → 复制 |
| **AbuseIPDB** | https://www.abuseipdb.com/account/api | Create Key → 复制 |
| **Account ID** | https://dash.cloudflare.com/ | 从侧边栏复制 Account ID |

💡 **提示**: 将新 keys 保存到密码管理器！

---

### 第 4 步: 配置本地开发 (2 分钟)

```bash
# 创建 .env 文件
cp .env.example .env

# 编辑并填入新 keys
nano .env

# 测试本地服务器
npm install
npm run dev
```

访问 http://localhost:4310/api/health 验证

---

### 第 5 步: 配置 Cloudflare Workers (3 分钟)

```bash
# 使用自动脚本（推荐）
./setup-secrets.sh

# 验证
wrangler secret list
```

应该看到 4 个 secrets

---

### 第 6 步: 配置 GitHub Actions (3 分钟)

```bash
# 使用自动脚本
./setup-github-secrets.sh

# 或手动访问
open https://github.com/taoyadev/iphey/settings/secrets/actions
```

添加 6 个 secrets（见脚本提示）

---

### 第 7 步: 部署并验证 (2 分钟)

```bash
# 部署 Worker
npm run deploy:worker

# 测试 API
curl https://iphey-api.YOUR_SUBDOMAIN.workers.dev/api/health

# 测试 IP lookup
curl https://iphey-api.YOUR_SUBDOMAIN.workers.dev/api/ip/8.8.8.8
```

---

## 📚 详细文档

| 文档 | 用途 | 何时使用 |
|-----|------|---------|
| **00-START_HERE.md** | 总览和快速开始 | 现在！ |
| **ACTION_CHECKLIST.md** | 完整行动清单 | 需要详细步骤时 |
| **SECURITY_SETUP.md** | 完整安全设置指南 | 需要深入理解时 |
| **QUICK_START.md** | 5 分钟快速指南 | 已熟悉流程时 |

---

## 🛠️ 自动化脚本

| 脚本 | 功能 | 使用场景 |
|-----|------|---------|
| `push-to-github.sh` | 安全推送到 GitHub | 第 1 步 - 推送代码 |
| `setup-secrets.sh` | 配置 Wrangler secrets | 第 5 步 - Worker 配置 |
| `setup-github-secrets.sh` | 配置 GitHub Actions secrets | 第 6 步 - CI/CD 配置 |

所有脚本都包含：
- ✅ 安全检查
- ✅ 用户确认
- ✅ 详细提示
- ✅ 错误处理

---

## 🎯 时间线建议

| 时间 | 行动 | 重要性 |
|-----|------|--------|
| **现在** | 推送到 GitHub | 🔴 紧急 |
| **现在** | 撤销所有泄漏的 keys | 🔴 紧急 |
| **5 分钟后** | 生成新 keys | 🟡 重要 |
| **10 分钟后** | 配置本地和 Wrangler | 🟡 重要 |
| **15 分钟后** | 配置 GitHub Actions | 🟢 常规 |
| **20 分钟后** | 部署并验证 | 🟢 常规 |

**总时间**: 约 20-30 分钟

---

## ✅ 验证清单

完成后，确认以下所有项目：

- [ ] GitHub 历史已更新（只有 3 个 commits）
- [ ] 所有旧 keys 已从提供商撤销
- [ ] 新 keys 已生成并保存
- [ ] 本地 `.env` 文件已配置且能运行 `npm run dev`
- [ ] Wrangler secrets 已配置（`wrangler secret list` 显示 4 个）
- [ ] GitHub Actions secrets 已配置（6 个）
- [ ] Worker 已部署并能访问 health endpoint
- [ ] API 测试通过（IP lookup 返回数据）
- [ ] 监控旧 keys 的使用情况

---

## 🔍 监控

持续监控旧 keys 的使用情况：

| Provider | 监控链接 | 查看内容 |
|----------|---------|---------|
| **IPInfo** | https://ipinfo.io/account/usage | API 调用统计 |
| **Cloudflare** | https://dash.cloudflare.com/ | Analytics 和日志 |
| **AbuseIPDB** | https://www.abuseipdb.com/account/api | API 使用情况 |

如果发现异常使用，立即联系提供商！

---

## 📞 需要帮助？

### 问题排查

**Q: 推送失败 "Permission denied"**
```bash
# 切换 GitHub 账号
gh auth switch

# 或使用 SSH
git remote set-url origin git@github.com:taoyadev/iphey.git
ssh-add ~/.ssh/id_rsa
git push -u --force origin main
```

**Q: Wrangler 登录失败**
```bash
wrangler logout
wrangler login
```

**Q: API 返回 500 错误**
```bash
# 检查 secrets
wrangler secret list

# 查看日志
wrangler tail

# 验证 keys 有效
curl -H "Authorization: Bearer $IPINFO_TOKEN" https://ipinfo.io/8.8.8.8
```

---

## 🎉 完成后

一旦所有步骤完成：

1. ✅ 你的 API keys 是安全的
2. ✅ Git 历史已清理
3. ✅ 应用正常运行
4. ✅ 未来的部署已自动化

**祝贺！** 🎊

---

## 📖 相关资源

- [Cloudflare Workers 文档](https://developers.cloudflare.com/workers/)
- [Wrangler CLI 文档](https://developers.cloudflare.com/workers/wrangler/)
- [GitHub Actions Secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets)

---

**创建时间**: 2025-12-17  
**Git History**: 3 commits (clean)  
**Leaked Keys**: 0 (in tracked files)  
**Status**: ⚠️ 等待用户执行推送和 key 撤销
