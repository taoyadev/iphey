# Cloudflare Workers + KV 部署指南

本指南帮助你将 IPhey 部署到 Cloudflare Workers，使用 Workers KV 作为全球分布式缓存。

## 📋 前置要求

- Cloudflare 账号
- Node.js 18+
- Wrangler CLI: `npm install -g wrangler`

## 🚀 部署步骤

### 1. 安装 Wrangler CLI

```bash
npm install -g wrangler

# 登录 Cloudflare 账号
wrangler login
```

### 2. 创建 KV Namespace

```bash
# 生产环境 KV
wrangler kv:namespace create "IP_CACHE"

# 预览环境 KV (用于开发测试)
wrangler kv:namespace create "IP_CACHE" --preview
```

记录输出的 KV namespace ID，你会看到类似：
```
✨ Success!
Add the following to your configuration file in your kv_namespaces array:
{ binding = "IP_CACHE", id = "abc123def456..." }
```

### 3. 创建 `wrangler.toml` 配置

在项目根目录创建 `wrangler.toml`：

```toml
# Cloudflare Workers 配置
name = "iphey"
main = "dist/worker.js"
compatibility_date = "2024-01-01"

# 账号信息
account_id = "你的账号ID"  # 从 Cloudflare Dashboard 获取

# KV 命名空间绑定
[[kv_namespaces]]
binding = "IP_CACHE"
id = "abc123def456..."  # 替换为实际的 KV namespace ID (生产)
preview_id = "xyz789..."  # 替换为预览环境的 ID

# 环境变量
[vars]
NODE_ENV = "production"
PORT = "8787"
LOG_LEVEL = "info"
CACHE_BACKEND = "kv"
CACHE_TTL_MS = "300000"
CACHE_STALE_TTL_MS = "1800000"
CACHE_WARMING_ENABLED = "true"
CACHE_WARMING_DELAY_MS = "100"
CLIENT_TIMEOUT_MS = "2500"

# Secrets (通过 wrangler secret 命令设置)
# IPINFO_TOKEN
# CLOUDFLARE_ACCOUNT_ID
# CLOUDFLARE_RADAR_TOKEN

# 路由配置 (可选)
routes = [
  { pattern = "iphey.yourdomain.com/*", zone_name = "yourdomain.com" }
]

# 限制和配置
[limits]
cpu_ms = 50  # CPU 时间限制

# 构建配置
[build]
command = "npm run build"

# 兼容性标志
[compatibility_flags]
nodejs_compat = true
```

### 4. 设置 Secrets

```bash
# IPInfo API Token
wrangler secret put IPINFO_TOKEN

# Cloudflare Radar (可选)
wrangler secret put CLOUDFLARE_ACCOUNT_ID
wrangler secret put CLOUDFLARE_RADAR_TOKEN
```

### 5. 创建 Workers 入口文件

创建 `src/worker.ts`：

```typescript
import { createApp } from './app';
import { config } from './config';
import { logger } from './utils/logger';
import { createCache } from './utils/cacheFactory';
import { cacheWarmer } from './utils/cacheWarming';
import { lookupIpInsight } from './services/ipService';
import type { NormalizedIpInsight } from './types/ip';

/**
 * Cloudflare Workers Environment
 */
interface Env {
  IP_CACHE: KVNamespace;

  // Secrets
  IPINFO_TOKEN?: string;
  CLOUDFLARE_ACCOUNT_ID?: string;
  CLOUDFLARE_RADAR_TOKEN?: string;

  // Variables
  NODE_ENV?: string;
  CACHE_BACKEND?: string;
  CACHE_TTL_MS?: string;
  CACHE_STALE_TTL_MS?: string;
}

/**
 * Global cache instance
 * Initialized once per Worker isolate
 */
let ipCache: any = null;

/**
 * Cloudflare Workers fetch handler
 */
export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    try {
      // Initialize cache on first request
      if (!ipCache && config.CACHE_BACKEND === 'kv') {
        logger.info('Initializing Cloudflare KV cache');
        ipCache = createCache<NormalizedIpInsight>('ip-insight', env.IP_CACHE);

        // Trigger cache warming in background
        if (config.CACHE_WARMING_ENABLED) {
          ctx.waitUntil(
            cacheWarmer.warmCache(lookupIpInsight, {
              enabled: true,
              delayBetweenRequests: config.CACHE_WARMING_DELAY_MS
            })
          );
        }
      }

      // Create Express app (or handle directly)
      // Note: Express doesn't run directly in Workers
      // You'll need to adapt the API routes to Workers format

      // For now, return a simple response
      return new Response(JSON.stringify({
        status: 'ok',
        message: 'IPhey running on Cloudflare Workers',
        cache: {
          backend: 'kv',
          ready: !!ipCache
        }
      }), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });

    } catch (error) {
      logger.error({ err: error }, 'Worker error');

      return new Response(JSON.stringify({
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'Unknown error'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }
};
```

### 6. 适配 Express 到 Workers

由于 Express 不能直接在 Workers 中运行，你需要：

**选项 A: 使用 @cloudflare/workers-adapter (推荐)**

```bash
npm install @cloudflare/workers-adapter
```

**选项 B: 使用 Hono (轻量级框架)**

```bash
npm install hono
```

Hono 是专为 Cloudflare Workers 设计的框架，API 类似 Express：

```typescript
import { Hono } from 'hono';
import { cors } from 'hono/cors';

const app = new Hono();

app.use('/*', cors());

app.get('/api/health', (c) => {
  return c.json({ status: 'ok' });
});

app.post('/api/v1/report', async (c) => {
  const body = await c.req.json();
  // ... 处理逻辑
  return c.json({ /* response */ });
});

export default app;
```

### 7. 部署

```bash
# 构建项目
npm run build

# 部署到 Cloudflare
wrangler deploy

# 查看日志
wrangler tail

# 测试
curl https://iphey.your-subdomain.workers.dev/api/health
```

## 📊 KV 使用限制

**免费计划：**
- ✅ 100,000 reads/day
- ✅ 1,000 writes/day
- ✅ 1,000 deletes/day
- ✅ 1,000 lists/day
- ✅ 1 GB 存储

**Workers Paid ($5/月)：**
- ✅ 10,000,000 reads/day
- ✅ 1,000,000 writes/day
- ✅ 无限存储

## 🎯 性能优化

### 1. 利用边缘缓存

```typescript
// 在 Worker 中添加 Cache API
const cache = caches.default;
const cacheKey = new Request(url, request);
let response = await cache.match(cacheKey);

if (!response) {
  response = await handleRequest(request);
  ctx.waitUntil(cache.put(cacheKey, response.clone()));
}

return response;
```

### 2. 使用 Durable Objects (可选)

对于需要强一致性的场景，可以使用 Durable Objects：

```toml
[[durable_objects.bindings]]
name = "RATE_LIMITER"
class_name = "RateLimiter"
script_name = "iphey"
```

### 3. 智能路由

```toml
# 使用 Smart Placement 自动选择最优区域
[placement]
mode = "smart"
```

## 🔍 监控和调试

### 查看实时日志

```bash
wrangler tail
```

### Workers Analytics

在 Cloudflare Dashboard > Workers > Analytics 查看：
- 请求数量
- 错误率
- CPU 时间
- KV 操作次数

### KV 数据查看

```bash
# 列出所有 keys
wrangler kv:key list --namespace-id=abc123def456

# 获取单个值
wrangler kv:key get --namespace-id=abc123def456 "8.8.8.8"

# 删除值
wrangler kv:key delete --namespace-id=abc123def456 "8.8.8.8"
```

## 💰 成本估算

**典型场景 (10K 请求/天):**
- Workers: 免费 (100K 请求/天)
- KV Reads: 免费 (100K/天)
- KV Writes: ~300/天 (缓存更新)
- **总成本: $0/月**

**高流量 (1M 请求/天):**
- Workers Paid: $5/月
- 额外请求: $0.50/million
- KV 操作: 包含在 Workers Paid
- **总成本: ~$5-10/月**

## 🎉 完成！

你的 IPhey 现在运行在全球 300+ 边缘节点上，享受：

✅ **超低延迟** - < 10ms 缓存读取
✅ **全球分布** - 自动路由到最近节点
✅ **自动扩展** - 无需管理服务器
✅ **高可用** - Cloudflare 的 SLA 保证

## 📚 参考资源

- [Cloudflare Workers 文档](https://developers.cloudflare.com/workers/)
- [Workers KV 文档](https://developers.cloudflare.com/kv/)
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/)
- [Hono Framework](https://hono.dev/)
