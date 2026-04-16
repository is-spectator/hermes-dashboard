# Hermes Dashboard — 第三方开源 Dashboard 插件 PRD

> **Version:** 2.0  
> **Date:** 2026-04-16  
> **Author:** 方脑壳  
> **Status:** Draft  
> **License:** MIT (planned)

---

## 1. 项目定位

### 1.1 一句话描述

**Hermes Dashboard** 是一个独立的第三方开源项目，为 Hermes Agent 提供一套视觉精致、动态美学驱动的替代 Dashboard 前端。它不修改 Hermes Agent 本身，而是作为即插即用的前端层，通过 Hermes 已有的 FastAPI 后端 API 提供服务。

### 1.2 与 Hermes 官方及现有生态的关系

本项目与 Nous Research / Hermes Agent 团队没有任何隶属关系。

Hermes Agent 生态中已存在的 UI 方案及本项目的差异定位如下：

| 项目 | 维护方 | 特点 | 不足 |
|------|--------|------|------|
| **官方 Dashboard** (v0.9.0+) | Nous Research | React 19 + TS + Tailwind v4 + shadcn/ui，功能完整 | 视觉设计偏素，组件质感一般，缺乏动效和品牌感 |
| **hermes-workspace** | outsourc-e | 8 主题，PWA，含 Chat + Terminal | 功能重（含聊天/终端），对只需管理面板的用户过于臃肿，且依赖 fork 的 Hermes 版本 |
| **hermes-webui** | nesquena | Vanilla JS，零构建步骤，轻量 | 聊天界面为主，不是管理 Dashboard；三面板布局不适合纯运维场景 |
| **mission-control** | 社区 | Agent 舰队管理，3.7k star | 面向多 Agent 编排场景，不是 single-instance 管理 |
| **本项目 (Hermes Dashboard)** | 方脑壳 | 动态美学、精致视觉、管理面板专注 | 新项目，需建设 |

**核心差异点**：本项目专注于**管理面板（Admin Dashboard）**这一个场景，不做聊天 UI、不做终端模拟、不做多 Agent 编排。在这个窄领域内，提供现有方案中**视觉品质和交互体验最好的**选择。

### 1.3 目标用户

本项目的目标用户画像非常明确——已经在使用 Hermes Agent 的 self-hoster 和开发者，他们：

- 已通过 CLI 或官方安装脚本部署了 Hermes Agent。
- 需要一个浏览器面板来完成日常管理操作（查看状态、管理 Key、浏览 Session、查看日志）。
- 对官方 Dashboard 的视觉品质不满意，但不想要 hermes-workspace 那种全功能工作台。
- 可能通过 SSH tunnel 远程访问 Dashboard（VPS 部署场景）。

---

## 2. 技术集成方案

### 2.1 Hermes Agent 现有架构

Hermes Agent 的官方 Dashboard 架构如下：

```
hermes dashboard [--port 9119] [--host 127.0.0.1]
         │
         ▼
┌─────────────────────────┐
│  FastAPI + Uvicorn       │ ← Python 后端
│  ├── /api/*              │ ← JSON API（config, status, keys, sessions, skills, logs...）
│  └── /* (static SPA)     │ ← 从 hermes_cli/web_dist/ 服务前端静态文件
└─────────────────────────┘
```

前端是 React 19 + TypeScript + Tailwind v4 + shadcn/ui 构建，产出打包到 `hermes_cli/web_dist/`，由 FastAPI 以 SPA 模式静态服务。

### 2.2 本项目的集成策略

本项目有两种安装模式：

**模式 A — 独立运行（推荐、默认模式）**

本项目作为独立的轻量 Web 应用运行，通过 HTTP 反向代理连接到 Hermes Agent 的 FastAPI 后端。

```
Browser ──▶ hermes-dashboard (localhost:3000)
                │
                ├── static assets (自身前端)
                └── /api/* ──proxy──▶ Hermes FastAPI (localhost:9119)
```

用户安装后只需配置 Hermes Agent 的后端地址即可使用。

```bash
# 安装
npm install -g hermes-dashboard
# 或
pip install hermes-dashboard

# 启动
hermes-dashboard --api http://127.0.0.1:9119
```

**模式 B — 替换官方前端**

高级用户可选择将本项目的构建产出替换 `hermes_cli/web_dist/` 目录，直接由 Hermes 的 FastAPI 服务。

```bash
hermes-dashboard build --output ~/.hermes/hermes-agent/hermes_cli/web_dist/
```

此模式不需要额外进程，但会覆盖官方前端，且 `hermes update` 后需要重新执行。

### 2.3 API 依赖

本项目仅依赖 Hermes Agent 对外暴露的 HTTP API，不 import 任何 Hermes Python 模块，不读取 `config.yaml` 或 `.env` 文件，不依赖文件系统。这保证了与 Hermes 版本的松耦合——只要 API 契约不变，Dashboard 就能工作。

需要对接的 API 端点（基于官方 Dashboard 和 hermes-webui 的已知端点）：

| 端点分类 | 端点示例 | 用途 |
|----------|----------|------|
| Health | `GET /health` | 后端连通性检测 |
| Status | `GET /api/status` | Agent 运行状态、网关状态、版本信息 |
| Config | `GET/POST /api/config` | 读取/修改全局配置 |
| Keys / Env | `GET/POST /api/env` | 读取/修改 .env 中的 API Key |
| Sessions | `GET /api/sessions`, `GET /api/session/:id` | 会话列表与详情 |
| Skills | `GET /api/skills` | Skill 列表 |
| Logs | `GET /api/logs` 或 WebSocket | 日志流 |
| Cron | `GET/POST /api/cron` | 定时任务管理 |
| Gateway | `GET/POST /api/gateway` | 网关状态与控制 |

**注意**：具体 API Schema 需在实施阶段通过阅读 Hermes Agent 源码（`hermes_cli/dashboard/` 目录）确认。本 PRD 中的端点为基于公开信息的推测，实施前需做 API 审计（audit）。

---

## 3. 功能范围

### 3.1 包含（In Scope）

| 功能 | 说明 |
|------|------|
| **Overview 首页** | 聚合状态仪表盘——Agent 状态、网关连接数、今日消息量、Skill 总数、最近活动 |
| **Provider / Key 管理** | 浏览和配置 LLM Provider 及 API Key，改善当前折叠列表的体验 |
| **Session 浏览** | 会话列表查看与搜索（只读），会话详情侧边栏 |
| **Skill 浏览** | Skill 列表查看、搜索、分类过滤（只读，enable/disable 如 API 支持则包含） |
| **日志查看** | 实时日志流、按级别过滤、文本搜索 |
| **Cron 管理** | 查看/创建/编辑/删除定时任务 |
| **Gateway 状态** | 各消息平台连接状态查看 |
| **Settings** | 全局配置查看/编辑、主题切换 |
| **Dark / Light 主题** | 双主题支持，Design Token 驱动 |
| **Responsive 适配** | 桌面端优先，移动端可用 |

### 3.2 不包含（Out of Scope）

| 功能 | 原因 |
|------|------|
| 聊天 UI | 不是本项目定位，Hermes 通过消息平台聊天 |
| 终端模拟器 | hermes-workspace 已覆盖 |
| 文件管理器 | 不在管理面板范围内 |
| 多 Agent / 多 Profile 管理 | mission-control 已覆盖 |
| Hermes Agent 安装/升级 | 用户自行通过 CLI 管理 |
| 认证系统 | 遵循 Hermes 默认的 localhost-only 策略，远程访问通过 SSH tunnel 解决。未来可考虑 |

---

## 4. 页面设计规格

### 4.1 全局布局

```
┌──────────────────────────────────────────────────┐
│ ┌──────┐                                         │
│ │      │                                         │
│ │ Side │         Main Content Area               │
│ │ Nav  │                                         │
│ │      │                                         │
│ │      │                                         │
│ │ 64px │                                         │
│ │(icon)│                                         │
│ │      │                                         │
│ └──────┘                                         │
└──────────────────────────────────────────────────┘
```

- 左侧导航栏：默认 64px 宽（仅图标），hover 或点击展开至 200px（图标 + 文字）。
- 底部有 Hermes Dashboard 版本标识和 GitHub 链接。
- 顶部右侧：主题切换按钮、语言切换（中/英）、Hermes Agent 连接状态指示器。

### 4.2 Overview（首页）

**目标**：用户打开 Dashboard 后 1 秒内感知系统是否正常。

**顶部区域 — Metric Cards（4 列网格）**：

| Card | 数据 | 动效 |
|------|------|------|
| Agent Status | Online / Offline / Degraded + 运行时长 | 状态点带呼吸脉动动画（Online: 2s 周期绿色脉动） |
| Messages | 今日消息总量 | 数字变化时 count-up 动画（400ms ease-out） |
| Active Gateways | `已连接 / 已配置` | — |
| Skills | 总数 + 今日新增 | — |

**中部区域 — Gateway Status Grid**：

每个已启用的消息平台以小卡片呈现（平台图标 + 名称 + 状态点）。已连接的排前面，断连的灰显。点击某平台跳转 Gateway 详情。

**底部区域 — 左右分栏**：

- 左侧：Recent Activity Feed（最近 15 条系统事件，时间线格式）。
- 右侧：Provider 健康摘要（各 Provider 的配置状态和最近调用延迟，如 API 提供该数据）。

### 4.3 Providers（替代原 KEYS 页面）

这是相比官方 Dashboard 改进最大的页面。

**当前问题回顾**：14 个 Provider 以无差别的折叠列表纵向排列，没有分组、没有搜索、没有视觉区分。已配置和未配置的 Provider 混在一起。右侧大量空白浪费。

**重设计方案**：

分为两个区域：

**区域 1 — Connected Services**：需要 OAuth / Device Code 认证的 Provider（如 OpenAI Codex、Nous Portal、Qwen CLI）。每个以独立卡片呈现，卡片内直接显示认证状态和操作按钮（Login / Disconnect）。已连接的卡片左边框为绿色条纹。

**区域 2 — API Key Providers**：只需 API Key 的 Provider（DeepSeek, Gemini, Kimi 等）。以 2-3 列卡片网格呈现。每张卡片包含 Provider 名称、Logo 占位图标、已配置 Key 数量、"Get Key" 外链。已配置的卡片有视觉区分（边框变为主色调）。点击卡片展开行内面板，可管理 Key（添加/替换/移除）。

顶部有搜索输入框和状态过滤器（All / Configured / Unconfigured）。

### 4.4 Sessions

顶部统计行：总会话数 | 今日会话 | 平均消息数/会话 | 总 Tool 调用次数。

下方为数据表格：

| 列 | 内容 |
|----|------|
| Title | 会话标题（自动生成或 LLM 摘要） |
| Source | 平台图标（CLI / Telegram / Discord / Slack / Cron 等） |
| Model | 模型名称 badge |
| Messages | 消息条数 |
| Tools | Tool 调用次数 |
| Time | 相对时间（"2h ago"） |

支持文本搜索（调用 Hermes FTS5）和平台过滤。

点击某行，右侧展开 Drawer 显示会话详情（完整消息列表、Tool 调用链、Token 消耗）。

### 4.5 Skills

卡片网格（每行 3 列，响应式降至 2 或 1 列）。

每张卡片：Skill 名称、描述（2 行截断）、分类标签（pill badge）、使用次数、来源标识（auto-generated / manual / hub）、enable/disable 开关（如 API 支持）。

顶部搜索栏 + 分类标签过滤。

### 4.6 Logs

全屏宽度的日志视图，终端风格（暗色背景、等宽字体、高行密度）。

顶部工具栏：级别复选框过滤器（DEBUG / INFO / WARN / ERROR）、搜索输入框、Auto-scroll 开关。

日志行格式：`[HH:MM:SS] [LEVEL] [module] message`，级别用颜色编码（DEBUG 灰、INFO 默认、WARN 琥珀、ERROR 红）。ERROR 行有左侧红色边框强调。

如 Hermes 提供 WebSocket 端点，使用 WebSocket 实现实时推送。否则使用轮询降级。

### 4.7 Cron

数据表格，列包括：任务名称、Schedule（Cron 表达式 + 人类可读翻译）、目标平台、状态（active / paused / error）、上次/下次执行时间。

操作：创建（弹窗表单）、编辑、暂停/恢复、删除、手动触发。

### 4.8 Gateways

每个消息平台一张卡片（2-3 列网格），卡片内容：平台图标 + 名称、连接状态（dot + 文字）、最近活跃时间。已连接的卡片有绿色左边框 + 状态点呼吸动画。

### 4.9 Settings

分区表单：General（语言、时区）、Appearance（主题切换、强调色）、Connection（Hermes Agent API 地址配置，模式 A 下需要）、About（版本、GitHub 链接、License）。

---

## 5. 设计系统

### 5.1 设计方向

**Terminal-Luxury**：终端的信息密度和等宽字体 + 精品软件的排版品质和动效细节。不是传统的 admin template 风格，不是消费级花哨风格，而是面向开发者的精致工具感。

视觉参考方向：Linear App 的克制精致 + Vercel Dashboard 的技术品位 + Raycast 的暗色质感。

### 5.2 Color Tokens

所有颜色通过 CSS Custom Properties 定义，支持 Dark / Light 主题切换。

**Dark Theme（默认）**：

| Token | Hex | 用途 |
|-------|-----|------|
| `--bg-primary` | `#09090b` | 页面背景 |
| `--bg-secondary` | `#18181b` | 卡片、面板背景 |
| `--bg-tertiary` | `#27272a` | 悬停态、输入框背景 |
| `--bg-elevated` | `#1c1c1f` | 弹出层、Drawer 背景 |
| `--border-default` | `#27272a` | 默认边框 |
| `--border-subtle` | `#1f1f23` | 弱分隔线 |
| `--text-primary` | `#fafafa` | 主文本 |
| `--text-secondary` | `#a1a1aa` | 辅助文本 |
| `--text-muted` | `#52525b` | Placeholder、禁用态 |
| `--accent` | `#3b82f6` | 主强调色（选中态、链接、主操作） |
| `--accent-muted` | `#1d4ed8` | 强调色暗调（hover） |
| `--success` | `#22c55e` | 已连接、健康 |
| `--warning` | `#eab308` | 警告、降级 |
| `--danger` | `#ef4444` | 错误、断连 |

**Light Theme**：

| Token | Hex | 用途 |
|-------|-----|------|
| `--bg-primary` | `#ffffff` | 页面背景 |
| `--bg-secondary` | `#f4f4f5` | 卡片背景 |
| `--bg-tertiary` | `#e4e4e7` | 悬停态 |
| `--border-default` | `#d4d4d8` | 默认边框 |
| `--text-primary` | `#09090b` | 主文本 |
| `--text-secondary` | `#71717a` | 辅助文本 |
| `--accent` | `#2563eb` | 主强调色 |
| `--success` | `#16a34a` | 成功 |
| `--warning` | `#ca8a04` | 警告 |
| `--danger` | `#dc2626` | 错误 |

### 5.3 Typography

| Token | 字体 | 用途 |
|-------|------|------|
| `--font-sans` | `"Geist Sans", system-ui, sans-serif` | UI 文本、导航、正文 |
| `--font-mono` | `"Geist Mono", "JetBrains Mono", ui-monospace, monospace` | 日志、代码、Metric 数字、技术 ID |

**字号阶梯**（rem 基准 16px）：

| Token | Size | Usage |
|-------|------|-------|
| `--text-xs` | 0.75rem (12px) | 标签、Badge、时间戳 |
| `--text-sm` | 0.875rem (14px) | 表格内容、辅助文本 |
| `--text-base` | 1rem (16px) | 正文 |
| `--text-lg` | 1.125rem (18px) | Section 标题 |
| `--text-xl` | 1.25rem (20px) | 页面标题 |
| `--text-2xl` | 1.5rem (24px) | Metric Card 数字 |

### 5.4 Spacing

4px 基础网格：`--space-1` (4px) 到 `--space-16` (64px)，间隔为 4 的倍数。

### 5.5 Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `--radius-sm` | 4px | Badge、小标签 |
| `--radius-md` | 6px | 按钮、输入框 |
| `--radius-lg` | 8px | 卡片 |
| `--radius-xl` | 12px | 面板、模态框 |

### 5.6 组件清单

以下组件需标准化定义，并在 `docs/components.md` 中文档化供社区贡献者参考：

| 组件 | 状态变体 |
|------|----------|
| StatusDot | online (green + pulse), degraded (amber + fast-pulse), offline (red + static), unknown (gray) |
| MetricCard | default, loading (skeleton shimmer), with-delta (趋势箭头) |
| ProviderCard | unconfigured, configured, connected, error |
| GatewayCard | disconnected, connected (border-breathe 动画), error |
| DataTable | empty, loading, populated, filtered |
| LogLine | DEBUG (gray), INFO (default), WARN (amber), ERROR (red + left-border) |
| SideDrawer | open (slide-in 200ms), closed |
| Badge | 语义色 variant (success / warning / danger / info / neutral) × outline / filled |
| SearchInput | empty, focused, with-results |
| EmptyState | 图标 + 说明文案 + CTA 按钮 |
| SkeletonLoader | 脉动 shimmer 动画 |
| Button | primary (filled accent), secondary (outline), ghost (transparent), danger |
| Tooltip | 上/下/左/右方向 |

---

## 6. 动态美学体系

### 6.1 核心原则

> 每一帧动画必须承载语义。不做纯装饰动效。

动效的作用是**降低认知负荷**——用户不需要阅读 "Online" 文字就能通过脉动的绿色圆点感知系统在运行；不需要对比两个数字就能通过 count-up 动画感知数据在增长。

### 6.2 动效分层

| 层级 | 名称 | 作用 | 实现约束 |
|------|------|------|----------|
| L1 | Ambient | 系统持续运行的生命感 | 纯 CSS @keyframes，仅 `opacity` + `transform` |
| L2 | Transition | 页面/组件状态切换 | CSS transition，duration ≤ 300ms |
| L3 | Feedback | 数据变化的即时反馈 | JS requestAnimationFrame，duration ≤ 500ms |

### 6.3 语义运动映射表

| 动效 | CSS/JS | 含义 | 应用 |
|------|--------|------|------|
| Slow pulse | `opacity: 0.6↔1, 2s ease-in-out infinite` | 健康、稳态运行 | StatusDot online |
| Fast pulse | `opacity: 0.4↔1, 0.8s ease-in-out infinite` | 压力、需关注 | StatusDot degraded |
| Border breathe | `border-color opacity 0.15↔0.4, 3s ease-in-out infinite` | 活跃连接 | GatewayCard connected |
| Count-up | JS: `requestAnimationFrame`, 400ms ease-out | 数值增长 | MetricCard 数字变化 |
| Fade-in-up | `opacity 0→1 + translateY 8px→0, 150ms ease-out` | 新元素出现 | 列表项加载、新日志推入 |
| Slide-in | `translateX 100%→0, 200ms ease-out` | 面板展开 | SideDrawer 打开 |
| Skeleton shimmer | `background-position 左→右, 1.5s linear infinite` | 数据加载中 | SkeletonLoader |

### 6.4 Reduced Motion 适配

所有循环动画和非必要过渡必须被以下媒体查询包裹：

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

### 6.5 性能护栏

- 同屏同时播放的循环动画不超过 5 个。
- @keyframes 仅允许 `opacity` 和 `transform`（合成器属性，不触发 layout/paint）。
- JS 动画必须使用 `requestAnimationFrame`，禁止 `setInterval`/`setTimeout`。
- 启用 `will-change` 的元素不超过 10 个（浏览器对 will-change 有资源限制）。

---

## 7. 技术方案

### 7.1 Tech Stack

| 层 | 选型 | 理由 |
|----|------|------|
| **Framework** | React 19 + TypeScript | 与 Hermes 官方 Dashboard 同栈，社区贡献者可复用经验。Hermes 生态已有 React 先例。 |
| **Styling** | Tailwind CSS v4 + CSS Custom Properties | Token-based theming 通过 CSS Variables 实现。Tailwind 提供原子类工具。 |
| **Build** | Vite 6 | 快速 HMR，简洁配置，与 Hermes 官方 Dashboard 一致。 |
| **State** | Zustand | 轻量，TypeScript 友好，无 boilerplate。 |
| **Data Fetching** | TanStack Query (React Query) | 自动缓存、后台刷新、loading/error 状态管理。 |
| **Router** | React Router v7 | SPA 路由。 |
| **Charts** | Recharts 或 Chart.js | Overview 页面的趋势图。 |
| **Icons** | Lucide React | 开源、Tree-shakeable、风格统一。 |
| **Linting** | ESLint + Prettier + Biome | 代码质量保障。 |

### 7.2 项目结构

```
hermes-dashboard/
├── package.json
├── vite.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── LICENSE                          ← MIT
├── README.md                        ← 安装、使用、截图
├── CONTRIBUTING.md                  ← 社区贡献指南
├── docs/
│   ├── design-system.md             ← Design Token 完整文档
│   ├── components.md                ← 组件规格文档
│   └── api-audit.md                 ← Hermes API 端点审计结果
├── src/
│   ├── main.tsx                     ← 入口
│   ├── App.tsx                      ← 路由 + Layout
│   ├── api/                         ← API Client（封装 Hermes 后端调用）
│   │   ├── client.ts                ← Axios/fetch 封装，base URL 配置
│   │   ├── hooks.ts                 ← TanStack Query hooks
│   │   └── types.ts                 ← API 响应类型定义
│   ├── components/                  ← 通用 UI 组件
│   │   ├── StatusDot.tsx
│   │   ├── MetricCard.tsx
│   │   ├── ProviderCard.tsx
│   │   ├── DataTable.tsx
│   │   ├── SideDrawer.tsx
│   │   ├── Badge.tsx
│   │   ├── EmptyState.tsx
│   │   ├── SkeletonLoader.tsx
│   │   └── ...
│   ├── pages/                       ← 页面组件
│   │   ├── Overview.tsx
│   │   ├── Providers.tsx
│   │   ├── Sessions.tsx
│   │   ├── Skills.tsx
│   │   ├── Logs.tsx
│   │   ├── Cron.tsx
│   │   ├── Gateways.tsx
│   │   └── Settings.tsx
│   ├── layouts/
│   │   └── DashboardLayout.tsx      ← 侧边栏 + 主内容区
│   ├── stores/
│   │   └── useAppStore.ts           ← Zustand 全局状态（主题、语言、连接状态）
│   ├── styles/
│   │   └── tokens.css               ← Design Token CSS Variables
│   └── lib/
│       └── utils.ts                 ← 工具函数
├── public/
│   └── favicon.svg
├── server/                          ← 模式 A 的轻量代理服务器（可选）
│   └── proxy.ts                     ← Node.js 反向代理，转发 /api/* 到 Hermes
└── scripts/
    └── build-replace.sh             ← 模式 B 的构建替换脚本
```

### 7.3 API Client 设计

```typescript
// src/api/client.ts
const BASE_URL = import.meta.env.VITE_HERMES_API_URL || 'http://127.0.0.1:9119';

// 所有 API 调用通过统一 client，方便切换 base URL
export const api = {
  getStatus: () => fetch(`${BASE_URL}/api/status`).then(r => r.json()),
  getSessions: (params?) => fetch(`${BASE_URL}/api/sessions?${qs(params)}`).then(r => r.json()),
  getSkills: () => fetch(`${BASE_URL}/api/skills`).then(r => r.json()),
  // ...
};
```

### 7.4 打包与分发

| 渠道 | 产物 | 安装命令 |
|------|------|----------|
| **npm** | `hermes-dashboard` 包（含 CLI 启动命令 + 构建产物） | `npm install -g hermes-dashboard && hermes-dashboard` |
| **PyPI (可选)** | Python wrapper，内嵌前端构建产物，启动 simple HTTP server | `pip install hermes-dashboard && hermes-dashboard` |
| **Docker** | `ghcr.io/你的用户名/hermes-dashboard` | `docker run -p 3000:3000 -e API_URL=http://host.docker.internal:9119 hermes-dashboard` |
| **GitHub Release** | 构建产物 zip/tarball | 下载解压后用任意静态服务器托管 |

**零外部 CDN 依赖**——所有资源打包到产物中，离线可用。这对 VPS 和内网部署场景至关重要。

### 7.5 性能预算

| Metric | Target |
|--------|--------|
| JS Bundle (gzipped) | < 120KB |
| CSS (gzipped) | < 15KB |
| FCP (localhost) | < 400ms |
| LCP (localhost) | < 800ms |
| Lighthouse Performance Score | ≥ 95 |

---

## 8. 开源策略

### 8.1 仓库规范

- **License**：MIT（与 Hermes Agent 一致）。
- **README**：含项目介绍、截图/GIF、安装方式（npm / pip / Docker / 手动）、配置说明、与 Hermes 版本兼容性矩阵。
- **CONTRIBUTING.md**：开发环境搭建、代码规范、PR 流程、Design Token 使用指南。
- **CHANGELOG.md**：语义化版本日志。
- **GitHub Actions CI**：lint + type-check + build + bundle size check（自动 comment PR 报告 size delta）。

### 8.2 版本策略

- 语义化版本（SemVer）：`MAJOR.MINOR.PATCH`。
- MAJOR 变更仅在 Hermes API 不兼容升级时触发。
- 在 README 中维护与 Hermes Agent 版本的兼容性矩阵。

### 8.3 社区建设

- 在 Hermes Agent 的 GitHub Discussions 和 Discord 社区宣传。
- 提交 PR 到 `awesome-hermes-agent` 列表（0xNyk/awesome-hermes-agent）。
- 发布到 Hermes Agent 官方文档的第三方集成页面（如其接受外部 PR）。

---

## 9. 里程碑

| Phase | 时间 | 交付 |
|-------|------|------|
| **Phase 0 — API Audit** | Week 1 | 阅读 Hermes Agent 源码，完整审计 Dashboard API 端点，输出 `docs/api-audit.md`。确认所有页面所需数据都能从 API 获取。 |
| **Phase 1 — Foundation** | Week 2-3 | 项目脚手架搭建（Vite + React + TS + Tailwind）。`tokens.css` 完成。DashboardLayout（侧边栏 + 路由）。Overview 首页。Hermes 连通性验证。 |
| **Phase 2 — Core Pages** | Week 4-6 | Providers 页面（重设计核心）。Sessions 页面。Logs 页面。通用组件库完成（StatusDot, MetricCard, DataTable, Badge 等）。 |
| **Phase 3 — Full Pages** | Week 7-8 | Skills、Cron、Gateways、Settings 四个页面。Dark/Light 主题完成。Responsive 适配。 |
| **Phase 4 — Polish & Ship** | Week 9-10 | 动效体系铺设。空状态/加载状态补全。性能优化至预算内。README + CONTRIBUTING 文档。npm/Docker 分发配置。GitHub Actions CI。首个 Release (v0.1.0)。 |

---

## 10. Open Questions

| # | 问题 | 影响 | 决策建议 |
|---|------|------|----------|
| 1 | Hermes Agent 的 Dashboard API 是否有 OpenAPI spec 或文档？ | 决定 Phase 0 工作量 | 优先阅读源码审计，不依赖文档 |
| 2 | API 端点在 Hermes 版本间是否稳定？有无 breaking change 历史？ | 决定兼容性策略 | 关注 Hermes Release Notes，锁定支持的最低版本 |
| 3 | 是否需要 npm + PyPI 双渠道分发，还是只选一个？ | 影响维护成本 | 建议 npm 为主（前端项目天然契合），PyPI 作为 nice-to-have |
| 4 | 项目命名？ | 品牌、npm 包名 | `hermes-dashboard` 最直接，需确认 npm 上是否可用 |
| 5 | 是否需要第一版就支持 i18n（中英文）？ | 影响开发周期 | 建议第一版先英文，架构预留 i18n 接口，v0.2 加中文 |
| 6 | 模式 B（替换官方前端）是否值得支持？ | 增加维护和测试成本 | 建议先只做模式 A，模式 B 作为文档说明而非正式支持 |

---

*End of document.*
