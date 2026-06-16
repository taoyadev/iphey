# IPhey 上线开发 Roadmap（Codex 执行手册）

> 本文件是给 **Codex** 的逐模块执行手册。目标：以最高效益把 IPhey 推到生产可用 + SEO 自然流量增长 + 竞品差异化。
> **正式域名：`iphey.org`**（已确定）。API 子域：`api.iphey.org`。
>
> **执行约束（Codex 必读，违反即返工）：**
>
> 1. 本机是 control plane，**禁止**本地跑 `wrangler dev` / `next dev` / Playwright / 长驻服务。运行时与 E2E 一律在 OpenClaw 执行。
> 2. 每个任务**必须**满足其"验收标准(DoD)"才算完成；改完跑 `npm run typecheck && npm run lint && npm test`（根）和 `npm run web:lint`（前端），贴输出。
> 3. **不要破坏后端契约**：IP provider 链"永不抛错、全失败回落 static default"的行为是硬约束（`src/services/ipService.worker.ts`）。新增 provider 只能 append + normalizer，不得改变回落语义。
> 4. 改 AI chat 行为时，`src/worker.ts` 与 `apps/web-next/app/api/ai/chat/route.ts` **两份必须同步**。
> 5. 单 PR 单关注点，Conventional Commits。涉及 secrets 绝不写入任何被 git 跟踪的文件。
> 6. 每完成一个 Phase，先停下来汇报（文件清单 + 命令输出 + 残留风险），再进入下一个。

---

## 0. 现状快照（2026-06，审计结论）

**技术栈**：Cloudflare Worker (Hono) 后端 `iphey-api.difft.workers.dev` + Next.js 16 / React 19 静态导出前端（Cloudflare Pages，project `iphey`，当前 `42356dc5.iphey-657.pages.dev`）。

**已具备（不要重做）：**

- 后端 9 个端点、IPbot→ipinfo→Radar→default 回落链、KV + memory 双层 stale-while-revalidate 缓存、请求去重、风险感知 TTL。
- 5 面板评分（browser/ip 各 0.30，location/hardware/software 各 0.133）。
- 前端 4 个静态路由（`/`、`/docs`、`/api-reference`、`/leaks`）、7 个 Tab、React Query、Framer Motion、暗色模式、Leaflet 地图、Tremor 图表、AI 助手浮窗。
- SEO 基础设施已存在：`sitemap.ts`、`robots.ts`、`site.webmanifest`、favicon 全套、根 `layout.tsx` 的 OG/Twitter/JSON-LD、Inter 字体 `display:swap`。
- CI：`.github/workflows/deploy.yml`（quality → deploy，push main 自动部署 Worker + Pages）。

**核心缺口（本 Roadmap 要解决的）：**
| # | 缺口 | 位置 | 严重度 |
|---|---|---|---|
| A | SEO 元数据全写死 `iphey.org`，但无自定义域名 → 信号指向不存在域名 | `layout.tsx`/`sitemap.ts`/`robots.ts` | **P0 阻断** |
| B | JSON-LD 含伪造 `AggregateRating 4.8/1250` → 违反 Google 政策 | `layout.tsx:92-212` | **P0 合规** |
| C | 3 个 TODO 假功能（history 持久化 / remediation / regenerate）点了无反应 | `page.tsx:215/218/222` | P1 |
| D | 子页 `'use client'` → 无独立 metadata，标题全是模板 | `/docs`,`/api-reference`,`/leaks` | P1 |
| E | 零分析、零错误监控 | 全局 | P1 |
| F | 评估器 ~1065 行零测试；report 生成、KV、AI chat 未测 | `src/services/report/*` | P1 |
| G | 无 pSEO 程序化页面（增长引擎缺失） | 前端 | P2 |
| H | AI chat 逻辑双份重复、易漂移 | worker.ts + route.ts | P2 |
| I | 未提交脏工作区（6 文件 + DEPLOYMENT_SUCCESS.md） | 仓库根 | 开工前清理 |

---

## 优先级与节奏总览

| Phase  | 主题                         | 对应目标          | 关键产出                                                   | 预估     |
| ------ | ---------------------------- | ----------------- | ---------------------------------------------------------- | -------- |
| **P0** | 上线阻断修复                 | 稳定上线          | 域名/DNS/路由打通、伪造数据清除、基线提交                  | 0.5–1 天 |
| **P1** | 功能做实 + SEO 地基 + 可观测 | 功能完整 + SEO    | 杀死假功能、子页 metadata、analytics、评估器测试、错误监控 | 3–5 天   |
| **P2** | SEO 增长引擎 + 差异化        | SEO 增长 + 差异化 | pSEO 程序化页面、内容、Core Web Vitals、竞品差异功能       | 5–8 天   |
| **P3** | 加固与打磨                   | 稳定 + 增长       | 限流/安全头、无障碍、AI chat 去重、性能压测                | 持续     |

> 效益排序原则：**先让信号正确（P0），再让产品无空壳（P1），再放大流量（P2）**。P0 不完成，P2 的所有 SEO 投入都会打水漂。

---

## Phase 0 —— 上线阻断修复（先做，必须全绿才进 P1）

### P0-1 固化基线（开工第一步）

- **做什么**：审阅当前未提交改动（`git status`：AGENTS.md / CLAUDE.md / README.md / page.tsx / docs/CONFIG.md / docs/DIRECT_DEPLOY.md 已改，DEPLOYMENT_SUCCESS.md 未跟踪）。判断 `page.tsx` 的 48 行改动是否有意图；文档类改动归类为一个 `docs:` 提交。`DEPLOYMENT_SUCCESS.md` 是部署日志，移入 `docs/` 或加进 `.gitignore`，不要散在根目录。
- **DoD**：`git status` 干净；基线提交完成；后续每个 Phase 从干净树开始。

### P0-2 配置 iphey.org 自定义域名（Cloudflare）

- **做什么**（需在 Cloudflare Dashboard / 用户协助操作，Codex 产出 runbook 并改配置）：
  1. Pages project `iphey` 绑定自定义域 `iphey.org` + `www.iphey.org`（www 301 → apex）。
  2. Worker 增加自定义路由 `api.iphey.org/*`，在 `wrangler.toml` 配 `routes`（或用 Custom Domain）。前端 `lib/api.ts` 的 `NEXT_PUBLIC_API_URL` 改为 `https://api.iphey.org`（在 GitHub Actions secret 与 Pages 构建变量里更新）。
  3. 更新 `docs/DIRECT_DEPLOY.md` 的 URL 矩阵：去掉 `iphey-api.difft.workers.dev` / `pages.dev` 作为正式入口的描述，标注为 fallback。
- **DoD**：`curl -sI https://iphey.org` 与 `curl -s https://api.iphey.org/api/health` 在 OpenClaw 上返回 200；前端线上请求确实打到 `api.iphey.org`（Network 面板验证，非 curl）。CORS 在 Worker 侧确认放行 `iphey.org`（当前是 allow `*`，绑域后建议收敛为白名单，见 P3-2）。
- **注意**：DNS 由用户在 Cloudflare 操作，Codex 给出精确步骤清单，不要假装已配好。

### P0-3 清除伪造结构化数据（合规，必做）

- **做什么**：`apps/web-next/app/layout.tsx:92-212` 的 JSON-LD 里删除 `aggregateRating`（4.8 / 1250 reviews）这类无真实来源的字段。`SoftwareApplication` 保留 name/category/offers(free)，但**去掉评分**，除非有真实可核验的评价来源。`Organization` 的联系方式/logo 确认真实。
- **DoD**：用 Google Rich Results Test（OpenClaw 浏览器）验证无 "unverifiable rating" 警告；JSON-LD schema 校验通过。

### P0-4 域名常量集中化（防止再次写死漂移）

- **做什么**：新建 `apps/web-next/lib/site.ts`，导出 `SITE_URL = 'https://iphey.org'`、`SITE_NAME`、`API_URL` 等常量。`layout.tsx`、`sitemap.ts`、`robots.ts`、未来子页 metadata 全部引用该常量，**消灭所有硬编码 URL**。
- **DoD**：`grep -rn "iphey.org" apps/web-next/app apps/web-next/components` 只在 `lib/site.ts` 出现一次定义；其余皆引用。

**Phase 0 验收门槛**：线上 `iphey.org` 可访问、API 走 `api.iphey.org`、Rich Results 无警告、工作区干净。未达成不进 P1。

---

## Phase 1 —— 功能做实 + SEO 地基 + 可观测

### 模块 1A：杀死"假功能"（用户体验无空壳）

对 `apps/web-next/app/page.tsx` 三个 TODO（215/218/222）逐一处理，**二选一：补实现 或 从 UI 移除**，禁止保留点了无反应的按钮。

- **1A-1 History 持久化**（`handleSaveRecord`，line 215）：当前仅 localStorage。决策：MVP 阶段就用 localStorage 做"实现"（明确标注为本地历史），把 TODO 注释删掉，确保保存/删除/趋势图(`HistoryTracker.tsx`)真的可用且数据持久跨刷新。**不要**为此引入后端存储（无登录体系，过度工程）。
  - **DoD**：OpenClaw 浏览器实测：保存 → 刷新 → 记录还在 → 删除生效；趋势图渲染正确。
- **1A-2 Remediation workflow**（`handleApplyRecommendation`，line 218）：`PrivacyToolkit.tsx` 的"应用建议"。MVP：改为展示具体操作步骤/跳转外部指南（建议步骤已有数据），去掉"一键修复"的虚假承诺；按钮文案改为"查看修复步骤"。
  - **DoD**：点击有明确反馈（展开步骤/打开指南），无死按钮。
- **1A-3 Fingerprint regenerate**（`handleRegenerate`，line 222）：接到真实的 `collectFingerprint()` 重采 + React Query `refetch`，让"重新分析"真的重新跑。
  - **DoD**：点击后指纹重新采集、report-card 查询重跑、分数刷新可见。

### 模块 1B：子页面 SEO metadata（缺口 D）

- **做什么**：`/docs`、`/api-reference`、`/leaks` 当前是 `'use client'`，无法导出 `metadata`。重构方案：把每个路由拆成 **Server Component 外壳 `page.tsx`（导出 `metadata` + 唯一 canonical + BreadcrumbList JSON-LD）** + **`'use client'` 的内层组件**（现有逻辑搬进 `XxxClient.tsx`）。
  - 每页写唯一 title/description/canonical（引用 `lib/site.ts`）。
  - 子页加 `BreadcrumbList` 结构化数据。
- **DoD**：`npm run web:build` 后检查 `out/docs.html` 等的 `<title>`/`<meta name=description>`/`<link rel=canonical>` 各页唯一且正确；Rich Results 测试 BreadcrumbList 通过。

### 模块 1C：Analytics + 监控（缺口 E）

- **1C-1 隐私友好分析**：接 **Cloudflare Web Analytics**（与 Pages 同源、无 cookie、无需同意横幅、对 SEO 隐私定位最契合）。在 `layout.tsx` 注入 beacon。**不要**用 GA4（与本产品"隐私"定位冲突，且要 cookie 同意）。
  - **DoD**：CF dashboard 能看到 PV；Lighthouse 不因脚本掉分。
- **1C-2 前端错误监控**：接 **Sentry**（`@sentry/nextjs`，静态导出兼容模式）或更轻的自托管方案。至少捕获前端运行时异常 + React Query 失败。
- **1C-3 后端可观测**：Worker 增加结构化日志采样 + 关键路径（provider 失败、回落到 default、AI 全模型失败）打点；评估接 **Cloudflare Workers Logpush / Analytics Engine** 或 Sentry Worker SDK。
  - **DoD**：人为制造一次 provider 失败，能在监控里看到事件。

### 模块 1D：评估器测试补齐（缺口 F）

当前测试仅覆盖 IPbot client/service（287 行），核心 1065 行评估器零测试。

- **做什么**：为 `src/services/report/` 五个 evaluator 各写 `__tests__/*.test.ts`，覆盖：正常输入打分、惩罚触发（headless UA、VPN/Tor、时区不一致、缺指纹、禁 cookie）、边界（空 payload）。再为 `index.ts` 的 `generateReportWithLookup` 写集成测试（mock IP 查询），断言权重组合与 `statusFromScore` 阈值（≥80/≥60）。补 `cloudflareKVCache` 与 AI chat 回落逻辑测试。
- **DoD**：`npm run coverage` 中 `src/services/report/` 行覆盖 ≥ 80%；全部 `npm test` 绿。

### 模块 1E：OG 图与社交卡兜底（缺口，低成本高回报）

- **做什么**：当前只有 `og-image.svg`（部分平台不渲染 SVG）。生成 `og-image.png`（1200×630），metadata 里 PNG 优先、SVG 兜底。每个子页可选生成专属 OG（用 `ImageResponse` 在构建期或静态导出预生成 PNG）。
- **DoD**：Twitter Card Validator / LinkedIn Post Inspector（OpenClaw）能正确预览大图。

**Phase 1 验收**：三处假功能消除；4 个路由各有唯一 metadata；analytics + 错误监控上线可见数据；评估器覆盖 ≥80%；OG 卡片各平台正常。

---

## Phase 2 —— SEO 增长引擎 + 竞品差异化（核心增长）

> 这是"SEO 自然流量增长"目标的主战场。IPhey 的天然优势：每个 IP / ASN / 指纹维度都是一个可程序化生成的落地页。对标 browserleaks / whoer / iphey.com 的打法是**程序化 SEO (pSEO)**。

### 模块 2A：程序化 SEO 落地页（缺口 G，最高增长杠杆）

后端已有 `/api/v1/ip/:ip/enhanced` 和 ASN 分析能力，可批量驱动落地页。

- **2A-1 IP 详情页** `/ip/[ip]`：为任意 IP 生成 "IP 地址 X 信息 / 是否 VPN/代理 / 风险评分 / 地理位置 / ASN" 落地页。静态导出无法预生成全部 IP，采用：**预生成高价值种子 IP 列表**（公共 DNS、主流云、Tor 出口、热门 ASN 段——`cacheWarming.ts` 已有种子可复用）+ 客户端动态查询其余。每页唯一 metadata + canonical + JSON-LD（`Dataset`/`Place`）。
- **2A-2 ASN 详情页** `/asn/[asn]`：ASN 归属、组织、风险画像、是否托管/数据中心。
- **2A-3 指纹技术词条页** `/fingerprinting/[topic]`：canvas / WebGL / audio / fonts / WebRTC 等技术科普词条（搜索量大、竞争中等），每页深度内容 + 与本产品检测能力联动 CTA。
- **2A-4 对比页** `/vs/[competitor]`（差异化 + 截流竞品品牌词）：iphey vs browserleaks / whoer / cover-your-tracks。
- **架构要求**：用 `generateStaticParams` 列出种子集；统一落地页模板组件；每类页面注册进 `sitemap.ts`（动态生成，分 sitemap index 若 >5万条）；内链结构（IP↔ASN↔topic 互链）。
- **DoD**：`web:build` 产出 N 个静态页，每页 title/description/canonical/JSON-LD 唯一；sitemap 包含全部；抽样 Rich Results 通过；Lighthouse SEO=100。

### 模块 2B：内容与 E-E-A-T

- 扩充 `SEOContentSection.tsx` 与 `/docs`：真实、有深度的指南（如何测 VPN 泄漏、指纹原理、隐私加固清单）。
- 加 `/blog` 或 `/guides`（静态 MDX）承载长尾关键词，建立主题权威(topical authority)。
- About / 方法论页解释评分算法 → 提升 E-E-A-T 与结构化数据可信度（替代被删的假评分）。
- **DoD**：≥5 篇高质量长文，内链到工具页与 pSEO 页；无关键词堆砌。

### 模块 2C：Core Web Vitals 优化（排名因子）

- 现状：`page.tsx` 1022 行单页 + 多处 Framer Motion + Leaflet/Tremor 重库。
- **做什么**：测真实 LCP/CLS/INP（OpenClaw Lighthouse + 真机）。拆分 `page.tsx`；首屏只加载 Overview，其余 Tab 懒加载（部分已 dynamic，继续）；Leaflet/Tremor 仅在需要的 Tab 动态载入；加 `preconnect`/`preload` 关键资源；审计 framer-motion 包体，必要时按需引入。
- **DoD**：移动端 Lighthouse Performance ≥ 90，LCP < 2.5s，CLS < 0.1，INP < 200ms（OpenClaw 实测截图为证）。

### 模块 2D：竞品差异化功能（目标三）

基于已有但未充分暴露的能力做差异化（先调研 browserleaks/whoer 缺什么）：

- **指纹唯一性/熵评分**：`scoring.ts` 已有 entropy 计算，做成"你的指纹在 N 人中唯一"的可视化（对标 EFF Cover Your Tracks，但加 IP 维度）。
- **实时变化监控**：`RealTimeMonitor.tsx` 已有雏形，强化为"指纹稳定性追踪"差异点。
- **API 开放**：`/api-reference` 已有，包装成开发者可直接调用的免费 IP 情报 API（利于外链与开发者流量）。
- **DoD**：至少 1 个竞品没有的差异点上线并在落地页/内容中作为卖点呈现。

**Phase 2 验收**：pSEO 页面成规模上线并进 sitemap；Lighthouse SEO=100 / Performance≥90；≥5 篇内容；≥1 差异化卖点；提交 sitemap 到 Google/Bing Search Console（用户操作，Codex 出步骤）。

---

## Phase 3 —— 加固与打磨（持续）

- **3-1 后端限流**：Worker 端点无限流。基于 Cloudflare Rate Limiting Rules 或 KV/Durable Object 计数，防滥用（尤其公开 API）。
- **3-2 安全头与 CORS 收敛**：当前 CORS allow `*`。绑域后收敛为 `iphey.org` 白名单；补 CSP / X-Content-Type-Options / Referrer-Policy / Permissions-Policy（Pages `_headers` 文件）。
- **3-3 无障碍 WCAG 2.2 AA**：已有 ARIA 基础，做一轮屏幕阅读器 + 键盘导航审计（accessibility agent），补对比度/焦点环。
- **3-4 AI chat 去重**（缺口 H）：把 `src/worker.ts` 与 `apps/web-next/app/api/ai/chat/route.ts` 的重复逻辑抽到共享模块，消除漂移风险（注意 Next 静态导出下 route.ts 的运行环境约束，可能需保留前端走 Worker 端点）。
- **3-5 cron 缓存预热**：`wrangler.toml` 的 `[triggers]` 当前注释掉，按 `scheduled()` 已实现的预热逻辑开启 cron。
- **3-6 E2E**：OpenClaw + Playwright 覆盖核心用户流（首页加载 → 看分数 → 切 Tab → AI 问答 → 子页导航）。

---

## 模块 ↔ 文件 速查表（防止 Codex 找错位置）

| 模块           | 主要文件                                                                                                                          |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| 域名/SEO 常量  | `apps/web-next/lib/site.ts`(新), `app/layout.tsx`, `app/sitemap.ts`, `app/robots.ts`                                              |
| 假功能         | `apps/web-next/app/page.tsx`(215/218/222), `components/HistoryTracker.tsx`, `components/PrivacyToolkit.tsx`, `lib/fingerprint.ts` |
| 子页 metadata  | `app/docs/`, `app/api-reference/`, `app/leaks/`（拆 Server 外壳 + Client 内层）                                                   |
| Analytics/监控 | `app/layout.tsx`, 新增 `instrumentation`/Sentry 配置, `src/worker.ts`                                                             |
| 评估器测试     | `src/services/report/__tests__/`(新), `src/services/report/*.ts`, `src/utils/cloudflareKVCache.ts`                                |
| pSEO           | `app/ip/[ip]/`, `app/asn/[asn]/`, `app/fingerprinting/[topic]/`, `app/vs/[competitor]/`(均新), `app/sitemap.ts`                   |
| 内容           | `components/SEOContentSection.tsx`, `app/docs/`, `app/blog/`(新)                                                                  |
| CWV            | `app/page.tsx`, `next.config.mjs`, 各重组件 dynamic import                                                                        |
| 后端加固       | `wrangler.toml`, `src/worker.ts`, `apps/web-next/public/_headers`(新)                                                             |
| AI chat 去重   | `src/worker.ts`, `apps/web-next/app/api/ai/chat/route.ts`, 新增共享模块                                                           |

## 每个 PR 的标准验收流程（Codex 默认执行）

1. 根：`npm run typecheck && npm run lint && npm test`
2. 前端：`npm run web:lint && npm run web:build`
3. 运行时/E2E/Lighthouse/Rich Results：**OpenClaw**（先 `ssh openclaw "~/bin/check-ram.sh"`）
4. Web/UI 改动：必须真实浏览器验证，截图为证；`curl 200` 仅辅助信号，不算验收。
5. 贴：改动文件清单 + 命令输出(pass/fail) + 残留风险。
