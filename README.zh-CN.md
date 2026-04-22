# Hermes Dashboard

> 一款面向 [Hermes Agent](https://github.com/NousResearch/hermes-agent) 的第三方、动效驱动的 Web 控制台 —— 实时对话、深度可观测、终端级精致视觉。

[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D20-brightgreen.svg)](https://nodejs.org/)
[![Hermes Agent](https://img.shields.io/badge/hermes--agent-v0.9.0-informational.svg)](https://github.com/NousResearch/hermes-agent)
[![Tests](https://img.shields.io/badge/tests-90%20passing-brightgreen.svg)](#开发)
[![Bundle](https://img.shields.io/badge/bundle-~107KB%20gz-brightgreen.svg)](#性能)

**🌐 语言** · [English](./README.md) · **简体中文**

![Hermes Dashboard —— Light 模式概览](./docs/screenshots/overview-light.png)

---

## 项目简介

**Hermes Dashboard** 是一款为本地部署的 Hermes Agent 提供的、独立的精致 Web 前端。本项目**与 Nous Research 及 Hermes Agent 团队无任何隶属关系** —— 这是一个独立的、MIT 协议开源的项目，仅通过 Hermes 的公开 HTTP API 与其通讯，**无需修改 agent 自身**。

开箱即用：

- **实时对话** —— 与你的 Hermes agent 流式 SSE 对话、多轮续话、完整调用 agent 的 tool / skill / memory
- **九个页面** 覆盖全部运维视角：概览 · 聊天 · 会话 · 平台 · 记忆与你 · 技能 · 工具与 MCP · 计划与成本 · 设置
- **Dark / Light 主题** + 完整中英双语 UI
- **零 CDN 依赖** —— 字体、图标、资源全部内置，适合气隙网络部署
- **主题 / 语言即时切换**，刷新后保留
- **尊重降动效偏好** —— 所有 keyframe 动画在 `prefers-reduced-motion: reduce` 下自动降级

视觉标杆对齐 **Linear** · **Vercel Dashboard** · **Raycast** —— 信息密度高但克制，每个动画都承载语义。

---

## 目录

- [截图](#截图)
- [为什么再做一个 Dashboard](#为什么再做一个-dashboard)
- [架构](#架构)
- [前置要求](#前置要求)
- [安装与运行](#安装与运行)
- [配置](#配置)
- [兼容性](#兼容性)
- [技术栈](#技术栈)
- [开发](#开发)
- [性能](#性能)
- [已知限制](#已知限制)
- [参与贡献](#参与贡献)
- [开源许可](#开源许可)
- [致谢](#致谢)

---

## 截图

顶部 banner 就是 **概览页的 Light 模式**。Dashboard 共有 9 个页面，每页的最佳体验是实机查看：

| 页面                | 你在这里能看到什么                                    |
| ------------------- | ----------------------------------------------------- |
| **概览 Overview**   | Agent 核心指标、7 天活动图、Cost by provider、学习动态 |
| **聊天 Chat**       | 与你的 Hermes agent 实时流式对话                       |
| **会话 Sessions**   | 所有 agent 运行的分屏浏览器，含完整消息详情            |
| **平台 Platforms**  | 消息网关连接状态（Telegram / Discord / Slack …）      |
| **记忆与你 Memory & You** | Hermes 记得什么、推测了什么、用什么语气说话       |
| **技能 Skills**     | 完整的 procedural memory 目录，支持分类搜索            |
| **工具与 MCP**      | 内置工具与 Model Context Protocol 服务器               |
| **计划与成本**      | 定时任务 + 当日/本周/本月花费                          |
| **设置 Settings**   | 主题、语言、Hermes API URL、配置查看器                  |

> 为了保持仓库轻量，我们只随源码提交 hero 截图。跑 `npm run dev` 就能看到每一页的实时效果；需要自己重新生成任意页面的截图，参考 [`docs/screenshots/README.md`](./docs/screenshots/README.md) 里的脚本。URL 查询参数 `?theme=light|dark` 与 `?lang=en|zh` 可直达任意组合。

---

## 为什么再做一个 Dashboard

| 项目                               | 维护方                          | 特点                                                        | 权衡                                       |
| ---------------------------------- | ------------------------------- | ----------------------------------------------------------- | ------------------------------------------ |
| 官方 Dashboard (v0.9.0)            | Nous Research                   | React 19 + shadcn/ui，功能完整                              | 视觉克制，几乎无动效                        |
| hermes-workspace                   | outsourc-e                      | 8 主题、PWA、含聊天 + 终端                                   | 偏重，依赖 fork 的 Hermes                  |
| hermes-webui                       | nesquena                        | Vanilla JS、零构建                                          | 偏聊天场景，非管理面板                      |
| mission-control                    | 社区                            | 多 agent 舰队管理                                           | 不是单实例场景                              |
| **Hermes Dashboard（本项目）**     | Hermes Dashboard contributors   | 单实例 · 真实对话 + 深度可观测                              | 范围刻意收窄                                |

**独特点：** Chat 页面是真的**与你的 Hermes agent 对话**（通过 Hermes 内置的 OpenAI 兼容 adapter），不是 mock。你 agent 的 tool、skill、memory 都会真实参与。

---

## 架构

```
┌──────────────────────────────────┐              ┌─────────────────────────────────────┐
│  浏览器                           │              │  Hermes Agent（本机）               │
│  ┌────────────────────────────┐  │              │                                     │
│  │ Hermes Dashboard           │  │   GET /api   │  :9119  FastAPI（Dashboard API）    │
│  │ http://localhost:5173      │──┼──────────────┼─►   /api/status   （公开）          │
│  │                            │  │              │     /api/sessions                   │
│  │ React 19 + Vite 6          │  │              │     /api/env · /api/config          │
│  │ Tailwind v4 + Geist 字体    │  │              │     /api/skills · /api/logs         │
│  │                            │  │  POST /v1    │                                     │
│  │                            │──┼──────────────┼─►   :8642  aiohttp（Chat API）      │
│  └────────────────────────────┘  │   SSE 流式    │     /v1/chat/completions            │
│                                  │              │     /v1/runs · /v1/models           │
└──────────────────────────────────┘              │                                     │
                                                  │  Agent loop 调用你配置的 provider   │
                                                  │  （OpenAI / DeepSeek / Anthropic 等）│
                                                  └─────────────────────────────────────┘
```

Dashboard 纯前端（自身无后端）。Vite 开发代理把 `/api/*` 与 `/v1/*` 转发到本机 Hermes 端口，浏览器请求保持同源，避开 CORS，认证 token 也走同域。

---

## 前置要求

1. **Node.js 20 或更新**（推荐 22；CI 跑在 Node 22 Alpine 上）。
2. **已安装并运行 Hermes Agent v0.9.0** —— 参见[官方安装指南](https://github.com/NousResearch/hermes-agent#installation)。
3. **至少一个 LLM provider API key** 已配置在 Hermes 那边（比如 `OPENAI_API_KEY` / `DEEPSEEK_API_KEY` / `ANTHROPIC_API_KEY` / `GLM_API_KEY`）。Dashboard 本身永远不会直接读取或存储这个 key —— 所有 LLM 调用由 Hermes 完成。

---

## 安装与运行

### 第 1 步 —— 开启 Hermes 的内置聊天 API

Hermes 在 `gateway/platforms/api_server.py` 中自带一个 **OpenAI 兼容 HTTP adapter**，监听 **8642** 端口，默认关闭。在 `~/.hermes/.env` 追加：

```bash
# 开启 OpenAI 兼容聊天 API（Chat 页依赖它）
API_SERVER_ENABLED=true
API_SERVER_HOST=127.0.0.1
API_SERVER_PORT=8642
API_SERVER_ALLOW_ALL_USERS=true
API_SERVER_CORS_ORIGINS=http://localhost:5173,http://localhost:3000

# 设置 API key，让 Dashboard 能续话（带 X-Hermes-Session-Id header）
API_SERVER_KEY=dashboard-local-$(openssl rand -hex 8)
```

把生成出的 `API_SERVER_KEY` 值记下来 —— 下面第 3 步会粘贴到 Dashboard 的 `public/runtime-config.js`。

然后启动（或重启）Hermes 网关：

```bash
hermes gateway run    # 前台运行，日志打到 stderr
# 或 hermes gateway start    # 以 launchd/systemd 后台服务运行
```

验证聊天 API 已起：

```bash
curl http://127.0.0.1:8642/health
# => {"status": "ok", "platform": "hermes-agent"}
```

### 第 2 步 —— 克隆并安装 Dashboard

```bash
git clone https://github.com/<your-fork>/hermes-dashboard.git
cd hermes-dashboard
npm install --legacy-peer-deps
```

> 加 `--legacy-peer-deps` 是因为 `recharts@2` 的 peer-dep 还写着 `react@^16||^17||^18`；实际运行在 React 19 下完全没问题。

### 第 3 步 —— 写入聊天 API key

编辑 `public/runtime-config.js`，粘贴第 1 步生成的 `API_SERVER_KEY`：

```js
window.__HERMES_RUNTIME_CONFIG__ = {
  API_URL: '',
  CHAT_API_KEY: 'dashboard-local-XXXXXXXXXXXXXXXX',  // ← 粘贴到这里
};
```

### 第 4 步 —— 运行

```bash
npm run dev
# ➜ Local:   http://localhost:5173
```

打开浏览器访问该地址，点左侧栏的 **Chat（聊天）**，输入一条消息 —— 应该看到配置好的模型真实流式回复。

### Docker（生产部署）

```bash
docker build -t hermes-dashboard .
docker run --rm -p 3000:80 \
  -e API_URL=http://host.docker.internal:9119 \
  -e CHAT_API_KEY=dashboard-local-XXXXXXXXXXXXXXXX \
  hermes-dashboard
# 访问 http://localhost:3000
```

容器启动时 entrypoint 会把运行时值写入 `runtime-config.js`，SPA 启动时读取。

---

## 配置

| 维度             | 机制                                                                                                          |
| ---------------- | ------------------------------------------------------------------------------------------------------------- |
| Dashboard API URL | Settings → Connection；fallback 顺序：运行时配置 → `VITE_HERMES_API_URL` → 同源                               |
| 聊天 API key     | `public/runtime-config.js` 的 `CHAT_API_KEY`（开发）；或 Docker 环境变量 `CHAT_API_KEY`                       |
| 主题             | 右上角 ☀️ / 🌙 切换；持久化到 `localStorage`                                                                  |
| 语言             | 右上角 EN / ZH 切换；持久化                                                                                   |
| Session token    | 自动从 Hermes SPA shell 通过 Vite 的 `/__hermes_bootstrap` 代理提取；Settings 提供手动 fallback 输入框          |

优先级（高优先级覆盖低）：**Settings 持久化 > 运行时配置 > 构建期环境变量 > 默认值**。

修改 baseUrl 时所有 React-Query 缓存会被清空并重新拉取 token。

---

## 兼容性

| Hermes Dashboard | Hermes Agent | 说明                                                                                                 |
| ---------------- | ------------ | ---------------------------------------------------------------------------------------------------- |
| 0.2.x            | **0.9.0**    | 已验证 `/api/status`、`/api/sessions`、`/api/config`、`/api/env`、`/api/skills`、`/api/logs` 以及 `/v1/*` 聊天 adapter。|

更老版本未测试。更新版本理论上兼容，前提是 `docs/api-audit.md` 中的契约保持不变；契约变化会触发双语错误 toast 而非静默失败。

---

## 技术栈

**框架** · React 19 · TypeScript 5.6 · Vite 6

**样式** · Tailwind CSS v4 · CSS custom properties · `@fontsource/geist-sans` + `@fontsource/geist-mono`

**状态** · Zustand 5（带 `persist`） · TanStack Query v5

**路由** · React Router v7（懒加载）

**图表** · Recharts 2

**图标** · Lucide React

**测试** · Vitest + `@testing-library/react` + happy-dom

**Lint** · ESLint flat config + `typescript-eslint` / `jsx-a11y` / `react-hooks`

**Bundle gate** · `size-limit` + `@size-limit/preset-app`

---

## 开发

```bash
npm run dev       # Vite 开发服务 :5173
npm run build     # 生产构建到 dist/
npm run preview   # 本地预览 dist/
npm run lint      # ESLint（禁止 warning）
npm run test      # Vitest watch
npm test -- --run # 一次性跑测试
npm run size      # size-limit 闸（critical < 120KB gz）
```

合并前 5 项 CI gate 必须全绿：

- **lint**（0 errors / 0 warnings）
- **tsc -b --noEmit**（0 type errors）
- **test**（当前 90 个测试，14 个文件）
- **build**（Vite 生产构建）
- **size-limit**（critical ≤120KB gz，CSS ≤15KB gz）

详细编码规范见 [`CONTRIBUTING.md`](./CONTRIBUTING.md)（禁 `any`、禁 `setInterval`、禁 `dangerouslySetInnerHTML`、所有用户可见字符串必须双语、动画必须在性能预算内）。

---

## 性能

| 指标                           | 预算      | 当前     |
| ------------------------------ | --------- | -------- |
| JS 首屏关键路径（gzipped）     | < 120 KB  | ~107 KB  |
| CSS（gzipped）                 | < 15 KB   | ~8 KB    |
| 总 JS（含懒加载 chunks）       | < 260 KB  | ~244 KB  |
| 同屏循环动画数                 | ≤ 5       | 3-4      |
| `will-change` 使用量           | ≤ 10      | 6        |

动画严格限定为 `opacity` 与 `transform`（GPU 合成层 —— 不触发 layout / paint）。`@media (prefers-reduced-motion: reduce)` 下全部动画与 transition 降级到 0.01ms。

---

## 已知限制

Dashboard 的能力被 Hermes Agent v0.9.0 实际暴露的 API 所约束：

1. **Skills 开关为只读**（v0.1.x）。`/api/skills/toggle` 在 v0.9.0 存在，但接入留给 v0.3.x。
2. **Cron CRUD 为只读** —— 仅展示 `config.cron` 快照。v0.9.0 实际已有完整 `/api/cron/jobs` CRUD，接入延期。
3. **Gateway 控制按钮**（重连 / 重启）缺席 —— `/api/status.gateway_platforms` 只读。
4. **日志走 2 秒轮询**，非 WebSocket。`/ws` 在 v0.9.0 返回 403。
5. **概览的"今日消息数"** 聚合最近 20 个 `started_at` 在今日的 session 的 `message_count`。后端无专用的今日端点。
6. **Configuration 编辑** 是 JSON textarea，不是字段表单（带确认弹窗后 `PUT /api/config`）。
7. **Chat 的模型选择器** 仅展示信息 —— 8642 adapter 只接受 `hermes-agent` 为 model id；真正模型由服务端 `config.model` 决定。

完整延期项列表见 [`CHANGELOG.md`](./CHANGELOG.md) 与 [`docs/hermes-dashboard-dev-checklist.md`](./docs/hermes-dashboard-dev-checklist.md)。

---

## 参与贡献

欢迎 bug report、PR 与 UX 反馈。

提 PR 前请本地跑：

```bash
npm run lint && npx tsc -b --noEmit && npm test -- --run && npm run build && npm run size
```

5 项全绿才能合并。详细流程与代码规范见 [`CONTRIBUTING.md`](./CONTRIBUTING.md)。

适合上手的 PR：

- 把未翻译的字符串翻成新语言（搜 `src/` 里只传了英文的 `useT()` 调用）
- 为缺失的页面补截图到 `docs/screenshots/`（Memory / Tools / Settings）
- 在运行 Hermes v0.9.0 以上新版本时遇到页面渲染异常 → 附复现步骤提 issue

---

## 开源许可

本项目采用 **MIT License** —— 完整条款见 [LICENSE](./LICENSE)。

```
MIT License

Copyright (c) 2026 Hermes Dashboard contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

你可以自由地 fork、修改、改名、商用与再分发本项目，只需在所有副本或主要部分中保留上述版权声明与许可声明。

---

## 致谢

- **[Hermes Agent](https://github.com/NousResearch/hermes-agent)** —— 本 Dashboard 存在的意义就是服务它，由 Nous Research 开源。与 Nous Research 无任何隶属或背书关系。
- 设计灵感：**Linear** · **Vercel Dashboard** · **Raycast**。
- 字体：**Geist Sans** / **Geist Mono**，由 Vercel 提供，通过 `@fontsource` 自托管。
- 图标：**Lucide**。

---

**🌐 其它语言** · [English](./README.md)
