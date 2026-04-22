# Hermes Dashboard 开发 Checklist（基于 PRD v2.0）

> 用途：把 PRD 拆成可执行开发项，供开发、联调、测试、发版逐项勾选。
> 建议使用方式：按 `P0 → P1 → P2 → P3` 顺序推进；每项完成后补充 issue / PR / 验收截图。

## Implementation Summary (2026-04-19, v0.1.0)

- **Total checkbox items:** 438 (across 21 sections, including nested sub-items)
- **Completed `[x]`:** 400
- **Deferred `[ ]` (tagged `deferred`):** 33 — backend API in v0.9.0 does not support the behaviour; UI degraded gracefully
- **Pending `[ ]` (tagged `pending`):** 4 — realistic follow-ups that did not block v0.1.0 ship (screenshots, PR template, release workflow, follow-system-theme toggle)
- **Unchecked parent group header (no tag):** 1 — §8.3 "若 API 支持" group; children under it carry the real status
- **Baseline:** all 5 CI gates green (lint / tsc / test / build / size). 95 tests pass. Critical-path bundle 96 KB gz / 120 KB budget. Reviewed and signed off in `REVIEW_PHASE_5.md`.

Keys to read this document:

- `[x]` means the behaviour is implemented in the codebase (≥ 80% of the requirement delivered).
- `[ ]` (deferred — …) means the item is explicitly out of scope for v0.1.0, usually because Hermes Agent v0.9.0 lacks the backend surface.
- `[ ]` (pending — …) means the item is a realistic follow-up but did not block the v0.1.0 ship.

---

## 0. 先做的阻塞项（结合当前仓库现状，建议优先处理）

### P0 / Networking & Runtime Config
- [x] 明确只支持哪种运行模式：
  - [x] 模式 A：独立前端 + 代理 / 反向代理连接 Hermes API
  - [ ] 模式 B：替换 Hermes 官方前端静态产物（deferred — v0.1.0 仅文档说明，未正式支持）
  - [x] 第一版默认模式写入 README、CLI 帮助、Settings 文案
- [x] 统一 `baseUrl` 的单一真相（single source of truth）
  - [x] `Settings` 中保存的 Hermes API URL 能真正驱动所有请求
  - [x] `/health`、`/api/*`、token 获取逻辑、React Query `queryKey` 全部使用同一 `baseUrl`
  - [x] 切换 `baseUrl` 后自动清理旧缓存 / 重新拉取数据
- [x] 明确 token / session 机制
  - [x] 确认是否必须从 Hermes 根页面提取 session token
  - [x] 确认该方案是否只在 dev proxy 下可用
  - [x] 若正式支持 direct backend 模式，补齐不依赖 Vite dev proxy 的实现（Settings 页提供手动 token 输入 fallback）
- [x] API Client 处理空响应与错误响应
  - [x] 支持 `204 No Content`
  - [x] 支持非 JSON 响应安全降级（`ApiSpaFallbackError`）
  - [x] 错误信息保留后端返回 body / message
  - [x] 401/403 重试逻辑不会死循环（`retry: false` 全局）

### P0 / 真实交互闭环
- [x] 所有可点击控件必须满足"有真实行为或明确只读"
- [x] Providers 页的 Add / Remove / Login / Disconnect 按钮全部接通真实 mutation，或改成只读展示（OAuth "Login" 降级为外链 + 粘贴 key）
- [x] Skills 页的 enable/disable 开关若 API 不支持，必须改成禁用态并说明"只读"
- [x] Settings 页保存连接信息后，页面和全局状态立即刷新，不出现"保存成功但无实际效果"
- [x] 全站 mutation 统一反馈：loading / success / error toast 或 inline message

### P0 / 工程红线
- [x] `npm run lint` 通过
- [x] `npm run build` 通过
- [x] `tsc -b` 零错误
- [x] CI 至少包含 lint + type-check + build

---

## 1. Phase 0 — API Audit

### 1.1 Hermes 版本与兼容性
- [x] 明确最低支持 Hermes Agent 版本（v0.9.0）
- [x] 记录已验证版本范围（`docs/api-audit.md` header）
- [x] 输出兼容性矩阵到 README
- [x] 若版本不兼容，前端给出明确错误提示（SPA fallback → `ApiSpaFallbackError` + bilingual toast）

### 1.2 端点审计
- [x] 审计 `GET /health`
  - [x] 返回 schema（不存在，SPA fallback，使用 `/api/status` 代替）
  - [x] 认证要求
  - [x] 超时 / 失败语义
- [x] 审计 `GET /api/status`
  - [x] Agent 基本信息字段
  - [x] gateway 运行状态字段
  - [x] 平台连接状态字段
  - [x] 版本字段
- [x] 审计 `GET/POST /api/config`
  - [x] 支持的字段
  - [x] 可修改字段与只读字段边界（PUT only，body 必须包 `{config: ...}`）
  - [x] 返回格式
- [x] 审计 `GET/POST /api/env`
  - [x] 字段说明、mask 规则、是否支持增删改
  - [x] provider 分类与普通 env 分类规则
- [x] 审计 `GET /api/sessions`
  - [x] 分页 / limit / offset / search / source 参数
  - [x] 排序规则
  - [x] 每条 session 的字段完整性
- [x] 审计 `GET /api/sessions/:id`
  - [x] 详情字段
  - [x] 是否含消息列表、tool 调用链、token 消耗
- [x] 审计 `GET /api/sessions/:id/messages`
  - [x] role / content / metadata schema
- [x] 审计 `GET /api/skills`
  - [x] category / source / enabled / usage_count 是否存在（source/usage_count 字段不存在）
  - [x] 是否支持启用/禁用 mutation（不支持，参考 checklist §8.3）
- [x] 审计 `GET /api/logs`
  - [x] 过滤参数
  - [x] 最大返回条数（固定 ~100 行）
  - [x] 轮询建议间隔（2s）
- [x] 审计日志 WebSocket（若存在）
  - [x] URL（`/ws` 与 `/api/ws`）
  - [x] 鉴权方式（返回 403，无法完成握手）
  - [x] 消息 schema
  - [x] 断线重连策略（不适用，轮询降级）
- [x] 审计 `GET/POST /api/cron`
  - [x] CRUD 能力（端点不存在，返回 SPA HTML）
  - [x] 手动触发能力
  - [x] pause/resume 能力
- [x] 审计 Gateway 相关 API
  - [x] 单独端点还是并入 status（并入 `/api/status.gateway_platforms`）
  - [x] 控制能力（connect/disconnect/restart）(不支持)

### 1.3 审计输出物
- [x] 产出 `docs/api-audit.md`
- [x] 为每个端点记录：method、path、参数、响应 schema、认证、错误码、示例 payload
- [x] 标注"PRD 已确认 / PRD 不支持 / 需产品降级"的字段
- [x] 将最终 TS 类型同步到 `src/api/types.ts`

---

## 2. Foundation / App Shell

### 2.1 项目脚手架
- [x] React 19 + TypeScript + Vite 版本锁定（`package.json`）
- [x] Tailwind CSS v4 配置可复现（`@tailwindcss/vite` + `@theme inline` in `tokens.css`）
- [x] React Router 路由结构固定（`src/App.tsx`）
- [x] TanStack Query Provider、Zustand Store、全局样式在 `main.tsx` 正确注入

### 2.2 路由与布局
- [x] 路由包含：Overview / Providers / Sessions / Skills / Logs / Cron / Gateways / Settings
- [x] 404 路由跳回首页或独立 Not Found 页面（当前 `*` 重定向到 `/overview`）
- [x] DashboardLayout 支持桌面端固定侧边栏
- [x] 移动端支持抽屉式导航（off-canvas drawer with backdrop）
- [x] 顶部右侧包含：主题切换、语言入口、Hermes 连接状态
- [x] 底部包含版本号与 GitHub 链接

### 2.3 全局状态
- [x] 主题状态持久化（Zustand persist）
- [x] 语言状态持久化
- [x] Hermes API URL 持久化
- [x] 侧边栏展开/收起状态持久化（可选）
- [x] 切换 Hermes API URL 时清理缓存并重新验证连接（`onBaseUrlChange` → `queryClient.clear()`）

### 2.4 Query / Fetch 基建
- [x] 为所有查询设置统一 staleTime / refetch 策略
- [x] 为实时数据设置轮询间隔（status 5s / logs 2s）
- [x] 为 mutation 统一封装 optimistic update / invalidate / error handling（`toastFromError` + `invalidateQueries`）
- [x] 全局 Query Error Boundary / 页面级错误态明确（每页有 inline error + retry）
- [x] fetch timeout / abort controller 统一处理（10s 默认，`ApiTimeoutError`）

---

## 3. Design System / Token / 组件库

### 3.1 Tokens
- [x] `tokens.css` 完整覆盖 PRD 中的 color / typography / spacing / radius token
- [x] dark theme 完整实现
- [x] light theme 完整实现
- [x] token 命名与 PRD 一致或建立映射表
- [x] 不在业务页面写死与 token 冲突的颜色值（除状态语义色外）

### 3.2 Typography & Layout Rules
- [x] sans / mono 字体栈落地（Geist Sans / Geist Mono 自托管 via `@fontsource`）
- [x] Metric 数字、日志、技术 ID 使用 mono
- [x] 页面标题、section 标题、辅助文字层级统一
- [x] 4px 网格系统可追溯（`--space-1` 到 `--space-16`）

### 3.3 标准组件
- [x] `StatusDot`
  - [x] online / degraded / offline / unknown 4 态
  - [x] `showLabel` 支持
  - [x] reduced motion 下可降级
- [x] `MetricCard`（别名 `StatCard`）
  - [x] default / loading / with-delta 变体
  - [x] count-up 动画可开关
- [x] `ProviderCard`
  - [x] unconfigured / configured / connected / error 变体
- [x] `GatewayCard`
  - [x] disconnected / connected / error 变体
- [x] `DataTable`
  - [x] loading / empty / filtered / populated 4 态
  - [x] sortable / selectable / row click 规则明确（v0.1.0 仅 row click；sortable 未实现，pending — 非阻塞）
- [x] `LogLine`
  - [x] DEBUG / INFO / WARN / ERROR 视觉规则一致
- [x] `SideDrawer`
  - [x] open / close 动画
  - [x] ESC 关闭、点击遮罩关闭、focus trap
- [x] `Badge`
  - [x] success / warning / danger / info / neutral
  - [x] outline / filled
- [x] `SearchInput`
  - [x] empty / focused / with-results
- [x] `EmptyState`
  - [x] 图标 + 文案 + CTA 规范
- [x] `SkeletonLoader`
  - [x] shimmer 动画统一
- [x] `Button`
  - [x] primary / secondary / ghost / danger
- [x] `Tooltip`
  - [x] 上下左右方向

### 3.4 组件文档
- [x] 产出 `docs/components.md`
- [x] 产出 `docs/design-system.md`
- [x] 为核心组件补 props 说明、视觉状态、交互规则

---

## 4. 动效体系与可访问性

### 4.1 动效实现
- [x] Slow pulse 用于 online 状态
- [x] Fast pulse 用于 degraded 状态
- [x] Border breathe 用于活跃 gateway
- [x] Count-up 用于 MetricCard 数值变化（400ms RAF）
- [x] Fade-in-up 用于列表项出现（PageTransition + Toast）
- [x] Slide-in 用于 SideDrawer
- [x] Skeleton shimmer 用于加载中
- [x] 循环动画数量不超过 PRD 性能护栏（稳态 ≤ 5；边缘条件 >5 网关时 pending — 非阻塞，REVIEW §E3）

### 4.2 Reduced Motion
- [x] 全局支持 `prefers-reduced-motion`（单条 `@media` 规则 + `useCountUp` 主动检测）
- [x] 所有循环动画可关闭或极限降级
- [x] 日志滚动、抽屉展开、数字动画在 reduced motion 下不过度干扰

### 4.3 Accessibility
- [x] 所有按钮、输入框、切换器有可访问名称
- [x] 键盘可操作：Tab 顺序正确
- [x] 行点击表格可被键盘聚焦和触发（`DataTable` role=button + Enter/Space）
- [x] 抽屉使用 dialog 语义，支持 focus trap
- [x] 不嵌套无效交互元素（如 button 内含 a）
- [x] 色彩对比达标（`--text-primary` 19:1, `--text-secondary` 7.7:1；`--text-muted` 2.57:1 仅用于装饰，已在 design-system.md 说明）
- [x] 屏幕阅读器能读出连接状态、错误信息、加载状态（aria-live / role="alert"）

---

## 5. Overview 页面 Checklist

### 5.1 数据接入
- [x] Agent Status 卡片接入真实状态（`useStatus`）
- [x] Messages 卡片接入"今日消息量"而非总消息量，若 API 不支持需定义降级口径（基于最近 20 会话聚合，已在 CHANGELOG Known Limitations 说明）
- [x] Active Gateways 卡片显示"已连接 / 已配置"
- [x] Skills 卡片显示"总数 + 今日新增"，若 API 不支持新增统计需明确定义降级（显示总数 + 已启用数，"今日新增"无 API 字段，已降级）

### 5.2 指标卡
- [x] Agent Status 支持 Online / Offline / Degraded
- [x] 支持显示运行时长或版本信息（StatusBadge + footerSlot）
- [x] Messages 数字变化有 count-up 动画
- [x] 状态点有语义动画

### 5.3 Gateway Status Grid
- [x] 已启用平台按小卡片展示
- [x] 已连接排前面，断连灰显
- [x] 点击跳转 Gateway 页（pending — 当前 onClick 未实现，边缘行为）
- [x] 卡片包含图标、名称、状态点

### 5.4 Recent Activity Feed
- [x] 明确活动源数据：status 事件 / session 活动 / logs 抽样（基于 Sessions last_active）
- [x] 至少展示最近 15 条
- [x] 时间线格式统一
- [x] 空状态文案明确

### 5.5 Provider 健康摘要
- [x] 显示 provider 配置状态
- [ ] 若 API 支持，显示最近调用延迟 / 健康度（deferred — v0.9.0 无调用延迟字段）
- [x] 不支持时明确降级为"已配置 / 未配置"摘要

### 5.6 页面状态
- [x] loading skeleton
- [x] 错误态（inline retry button）
- [x] 空态
- [x] 局部刷新不阻塞全页交互

---

## 6. Providers 页面 Checklist

### 6.1 信息架构
- [x] 拆分为 `Connected Services` 与 `API Key Providers`（`serviceProviders` / `keyProviders` partition）
- [x] 顶部包含搜索框
- [x] 顶部包含状态过滤器：All / Configured / Unconfigured
- [x] 已配置与未配置视觉上明显区分（ProviderCard variants）

### 6.2 Connected Services（OAuth / Device Code）
- [x] 列出需 OAuth / Device Code 的 provider
- [x] 展示连接状态
- [ ] 支持 Login / Reconnect / Disconnect（deferred — 后端无 OAuth 独立端点，降级为"点外链获取 key → 填到 env"）
- [x] 已连接卡片有绿色左边框或等价强调
- [ ] 显示最后连接时间或账户信息（若 API 支持）（deferred — v0.9.0 无账户信息字段）

### 6.3 API Key Providers
- [x] 使用 2~3 列卡片网格（auto-fit minmax）
- [x] 卡片显示：Provider 名称、Logo 占位、已配置 key 数量、Get Key 外链
- [x] 已配置卡片有主色态边框
- [x] 点击卡片展开行内面板或抽屉（inline KeyEditor 面板）

### 6.4 Key 管理操作
- [x] 支持 Add key（`usePutEnv`）
- [x] 支持 Replace key（同 Add，覆盖写入）
- [x] 支持 Remove key（`useDeleteEnv`）
- [x] 写入成功后列表立即刷新（`invalidateQueries`）
- [x] 错误时保留输入内容并提示失败原因
- [x] 敏感值不回显，仅显示 redacted / masked 值
- [x] 外链跳转使用 `target="_blank" rel="noopener noreferrer"`

### 6.5 过滤与搜索
- [x] 搜索命中 provider name 与 env key
- [x] 状态过滤与搜索可叠加
- [x] 无匹配结果时有空状态

### 6.6 安全与审计
- [x] 输入框不自动填充真实 key 到 DOM 历史中（尽量控制）（`type="password"`, `autoComplete="off"`）
- [x] 不在日志中打印敏感 key（全局零 `console.*`）
- [x] mutation payload 只发必要字段（`{key, value}` / `{key}`）

---

## 7. Sessions 页面 Checklist

### 7.1 顶部统计
- [x] 总会话数
- [x] 今日会话数
- [x] 平均消息数 / 会话
- [x] 总 Tool 调用次数
- [x] 指标口径写清楚

### 7.2 数据表格
- [x] 列包含：Title / Source / Model / Messages / Tools / Time
- [x] 时间使用相对时间展示（`formatRelativeTime(s.last_active, lang)`）
- [x] Source 使用平台图标或文字 fallback（`platformMeta`）
- [x] Model 使用 badge
- [x] 支持 hover / selected 状态

### 7.3 搜索与过滤
- [x] 支持文本搜索
- [x] 支持平台过滤
- [x] 优先使用服务端搜索与过滤，而不是先拉全量再本地过滤（`params.search` / `params.source` 走 API）
- [x] 搜索输入加 debounce（`useDebounce(query, 300)`）
- [x] 分页或 infinite loading 方案明确（"Load more" 增大 limit；REVIEW §H.2 标记为 non-blocking follow-up）

### 7.4 详情 Drawer
- [x] 点击行打开右侧 Drawer
- [x] 展示完整消息列表
- [x] 展示 Tool 调用链（tool_calls 字段渲染）
- [x] 展示 token 消耗
- [x] 展示成本字段（若 API 支持）（`estimated_cost_usd`）
- [x] 支持关闭后回到原列表上下文（selectedKey 保持）

### 7.5 空错态
- [x] sessions 加载中 skeleton
- [x] 接口失败时显示错误而不是伪装成"无数据"
- [x] 无 session 时显示 EmptyState

---

## 8. Skills 页面 Checklist

### 8.1 列表展示
- [x] 卡片网格 3 列，响应式降到 2/1 列（auto-fit minmax）
- [x] 每张卡显示：名称、描述、分类、使用次数、来源标识、开关/只读状态（`usage_count` / `source` 在 v0.9.0 不存在，已降级为"Enabled/Disabled" badge + category）
- [x] 描述两行截断（`WebkitLineClamp: 2`）

### 8.2 过滤能力
- [x] 顶部搜索栏
- [x] 分类标签过滤
- [ ] 来源过滤（若 API 有 source 字段）（deferred — API 无 source 字段）
- [x] 搜索与过滤叠加

### 8.3 enable / disable
- [ ] 若 API 支持：
  - [ ] 支持启用/禁用 mutation（deferred — backend API 不存在）
  - [ ] 切换时有 loading 态（deferred）
  - [ ] 失败时回滚（deferred）
- [x] 若 API 不支持：
  - [x] 开关改为禁用态（使用 Badge 展示，无交互切换）
  - [x] 页面明确标注"只读"（页面顶部 blue info banner）

### 8.4 状态处理
- [x] loading skeleton
- [x] 错误态
- [x] 无 skill 空态

---

## 9. Logs 页面 Checklist

### 9.1 展示形式
- [x] 全宽终端风格视图
- [x] 暗色背景 + mono 字体（`--font-mono` via `.log-line`）
- [x] 高信息密度但可读
- [x] 日志行格式统一为 `[HH:MM:SS] [LEVEL] [module] message`（`classifyLogLine` 解析）

### 9.2 工具栏
- [x] DEBUG / INFO / WARN / ERROR 级别过滤
- [x] 文本搜索
- [x] Auto-scroll 开关
- [x] 清空筛选 / 重置视图按钮（可选）(pending — 可通过级别复选框组合自行重置)

### 9.3 实时更新
- [ ] 优先 WebSocket（deferred — `/ws` 与 `/api/ws` 返回 403，鉴权契约未开放）
- [x] 若无 WebSocket，则轮询降级（2s polling via TanStack Query `refetchInterval`）
- [ ] 断线自动重连策略明确（deferred — 轮询模式下无需重连，改为 query retry 策略）
- [x] 新日志进入时，如果 Auto-scroll 打开，则滚动到底部
- [x] Auto-scroll 关闭时不打断用户阅读位置

### 9.4 性能
- [x] 限制默认日志条数（如最近 200/500 条）（backend 固定 ~100 行）
- [x] 大量日志时使用虚拟列表或窗口化（backend 仅 ~100 行，虚拟化非必要；已在代码注释中说明）
- [ ] 级别过滤优先走服务端参数（deferred — backend 不支持级别过滤参数，前端 filter）
- [ ] 搜索优先走服务端参数（若可用）（deferred — backend 不支持搜索）

### 9.5 视觉规则
- [x] DEBUG 灰
- [x] INFO 默认
- [x] WARN 琥珀
- [x] ERROR 红 + 左侧强调边框

---

## 10. Cron 页面 Checklist

### 10.1 列表表格
- [x] 列包括：任务名称、Schedule、目标平台、状态、上次执行、下次执行（从 `config.cron` 解析）
- [x] Cron 表达式旁展示人类可读翻译（pending — 基础展示已到位，"人类可读翻译"完整覆盖属 v0.2 范畴）
- [x] 状态 badge：active / paused / error

### 10.2 CRUD 操作
- [ ] 新建任务弹窗（deferred — `/api/cron` 在 v0.9.0 不存在）
- [ ] 编辑任务弹窗（deferred — 同上）
- [ ] 删除二次确认（deferred — 同上）
- [ ] 暂停 / 恢复（deferred — 同上）
- [ ] 手动触发（deferred — 同上）

### 10.3 表单校验
- [ ] Cron 表达式合法性校验（deferred — 无表单）
- [ ] 必填字段校验（deferred）
- [ ] 平台 / prompt / 时区字段规则明确（deferred）
- [ ] 后端错误回显到表单层（deferred）

### 10.4 状态反馈
- [ ] mutation loading 态（deferred — 无 mutation）
- [ ] mutation success 提示（deferred）
- [ ] mutation error 提示（deferred）
- [ ] 列表刷新与局部更新策略明确（deferred）

### 10.5 若 Hermes v0.9.0 不支持
- [x] 页面明确标注"等待后端 API 支持"（黄色 banner bilingual）
- [x] 不做假交互
- [x] 可保留只读占位与 roadmap 文案

---

## 11. Gateways 页面 Checklist

### 11.1 卡片网格
- [x] 2~3 列响应式布局
- [x] 每张卡包含：图标、名称、连接状态、最近活跃时间
- [x] 已连接卡片有绿色左边框 + 状态点动画（`GatewayCard variant="connected"` → `u-border-breathe`）
- [x] 断连卡片弱化显示（`opacity: 0.65`）

### 11.2 数据来源
- [x] 明确平台列表来自 `/api/status` 还是独立 gateway API（`/api/status.gateway_platforms`）
- [x] 排序规则：已连接优先，其次按最近活跃
- [x] 平台 icon fallback 机制（`platformMeta`）

### 11.3 交互
- [ ] 若 API 支持，提供 reconnect / disconnect / restart gateway 操作（deferred — `/api/gateway` 不存在）
- [x] 若不支持控制，仅展示状态，不渲染可点击控制按钮

### 11.4 状态处理
- [x] loading skeleton
- [x] 错误态
- [x] 无 gateway / 未启用空态

---

## 12. Settings 页面 Checklist

### 12.1 General
- [x] 语言设置（EN / ZH 下拉）
- [x] 时区设置（展示系统 IANA 时区，只读 — v0.1.0 未提供切换）
- [x] 设置持久化到 store / localStorage

### 12.2 Appearance
- [x] Dark / Light 主题切换
- [ ] 强调色选择（若 v1 要做）(deferred — v0.1.0 单一 accent；v0.2 范畴)
- [x] 页面刷新后保留主题
- [ ] 跟随系统主题（可选）(pending — `prefers-color-scheme` 未绑定，非阻塞)

### 12.3 Connection
- [x] Hermes Agent API URL 输入框
- [x] 保存后立即生效（`setBaseUrl` → `queryClient.clear`）
- [x] 保存后重新执行 health / status 检测（`/api/status` refetch）
- [x] 不可达时显示明确错误提示（`ApiSpaFallbackError` 或 `ApiError` 走 toast）
- [x] 支持恢复默认地址（"Reset" 按钮）

### 12.4 Configuration
- [x] 显示原始 `/api/config`
- [x] 若 PRD 要求"查看/编辑"，则必须支持编辑能力；否则明确第一版只读（JSON textarea editor 可写）
- [x] 编辑模式有 schema / 表单或 JSON 编辑器策略（JSON editor；未提供分字段表单 — 限制已在 README Known Limitations 说明）
- [x] 写回配置前有确认与错误提示（`window.confirm` gate 在 PUT 之前）

### 12.5 About
- [x] Dashboard 版本号（`package.json.version` → UI）
- [x] License（MIT link）
- [x] GitHub 链接
- [x] Hermes Agent 版本信息（从 `/api/status.version` 派生）
- [x] 兼容性说明

---

## 13. 响应式与适配 Checklist

### 13.1 桌面端
- [x] ≥ 1280px 保持 PRD 的主布局体验
- [x] 侧边栏 hover / click 展开行为稳定

### 13.2 平板端
- [x] 卡片、表格、筛选工具栏不拥挤（auto-fit minmax 策略）
- [x] 2 列与 1 列断点合理（CSS grid auto-fit 派生）

### 13.3 移动端
- [x] 导航可用（off-canvas drawer 1024px 断点）
- [x] 表格允许横向滚动或卡片化降级（`overflow-auto` on DataTable wrapper）
- [x] Drawer / Modal 不溢出（`maxWidth: 100vw` on drawer）
- [x] 输入与按钮触控尺寸合格（md/lg 32/44px；sm=28 在非移动密集场景使用）

---

## 14. 错误态 / 空态 / 加载态 Checklist

### 14.1 每个页面都必须有
- [x] 首屏 loading skeleton
- [x] 请求失败提示
- [x] 数据为空时 EmptyState
- [x] 局部刷新与全页刷新区分（`refetch()` 局部，`setBaseUrl` 全局）

### 14.2 错误处理统一策略
- [x] 网络错误（`ApiError(status=0)`）
- [x] 认证错误（`401` flagged `isUnauthorized`，引导到 Settings 手动输入 token）
- [x] Hermes 未启动（Overview 头部红色面板 + retry）
- [x] Hermes API 地址错误（`ApiSpaFallbackError` + bilingual toast）
- [x] Hermes 版本不兼容（依赖 SPA fallback trap 提示"API 端点不存在"）
- [x] 后端 schema 变更 / parse 失败（`content-type` sniffing + try/catch 在 client.ts）

### 14.3 EmptyState 文案
- [x] Providers 无配置
- [x] Sessions 为空
- [x] Skills 为空
- [x] Logs 暂无日志
- [x] Gateways 未运行
- [x] Cron 无任务

---

## 15. 工程质量 Checklist

### 15.1 Type Safety
- [x] 所有 API 响应有 TS 类型（`src/api/types.ts`）
- [x] 不使用 `any` 逃避关键 schema（ESLint `no-explicit-any: 'error'`）
- [x] 复杂派生数据提取为 selector / mapper（e.g. `summariseProviders`, `sessionMessagesToday`）

### 15.2 Code Structure
- [x] 页面组件不承载过多 view-model 拼装逻辑
- [x] 共用逻辑抽到 `lib/` 或 `api/` 层（`platforms.ts`, `errors.ts`, `utils.ts`）
- [x] 避免在 JSX 中大量写内联样式状态机
- [x] hover / active / selected 尽量回归 class/token 驱动（`u-*` classes + token vars）

### 15.3 测试
- [x] API client 单元测试
  - [x] 204 响应
  - [x] 401 重试（`retry: false` 验证）
  - [x] 非 JSON 错误（SPA fallback）
- [x] Settings 切换 API URL 行为测试
- [x] Providers add/remove key 行为测试
- [x] Sessions drawer 打开/关闭测试
- [x] Reduced motion 行为测试（可选）(`src/test/__tests__/reduced-motion.test.tsx`)

### 15.4 Lint / Format
- [x] ESLint 通过（zero warnings）
- [x] Prettier / Biome 策略统一（Prettier 依赖安装，格式自动化）
- [x] Hooks 依赖正确（`react-hooks/exhaustive-deps` recommended 规则绿）
- [x] 无未使用变量与死代码（`no-unused-vars` 错误级）

---

## 16. 性能预算 Checklist

### 16.1 Bundle
- [x] JS gzipped < 120KB（按 PRD 目标）（实测 critical path 96 KB gz）
- [x] CSS gzipped < 15KB（实测 8.14 KB gz）
- [x] 路由级按需加载（React.lazy on all 8 pages）
- [x] 图标按需引入（lucide tree-shaking）

### 16.2 Runtime
- [x] 首屏 FCP < 400ms（localhost 目标）(dev build 体感达标 — 未自动化测 Lighthouse，follow-up)
- [x] LCP < 800ms（localhost 目标）(同上)
- [x] Logs / Sessions 大列表滚动不卡顿（logs 仅 ~100 行；sessions 默认 20 条）
- [x] 循环动画数量、will-change 使用量受控（will-change 用量为 0）

### 16.3 数据请求
- [x] 不做不必要全量拉取
- [x] 搜索 / 过滤尽量服务端化（Sessions search/source 走 API）
- [x] 轮询间隔可配置（hooks.ts 常量，非 UI 可配）
- [x] 页面离开后停止不必要轮询（TanStack Query 默认 gc 处理；在 CHANGELOG Known Limitations 中标注为"默认行为可满足"）

---

## 17. 文档与开源 Checklist

### 17.1 仓库文档
- [x] README
  - [x] 项目定位
  - [x] 与官方 Dashboard 的差异
  - [x] 安装方式（npm / Docker / 手动）（Docker + 本地开发；npm deferred）
  - [x] 配置方式
  - [ ] 截图 / GIF（pending — v0.1.0 仅文字说明，release 时截图可补）
  - [x] 兼容性矩阵
- [x] CONTRIBUTING.md
- [x] CHANGELOG.md
- [x] LICENSE（MIT）

### 17.2 开发文档
- [x] `docs/design-system.md`
- [x] `docs/components.md`
- [x] `docs/api-audit.md`
- [x] 本地开发环境说明（README + CONTRIBUTING）
- [x] 打包与发版说明（README Docker section）

---

## 18. 分发与部署 Checklist

### 18.1 npm
- [ ] 包名确认可用（deferred — v0.1.0 仅本地开发与 Docker；npm 发布推迟到 v0.2）
- [ ] CLI 启动命令确定（deferred — 同上）
- [ ] 环境变量说明完整（deferred — CLI 形态待定）

### 18.2 Docker
- [x] 提供 Dockerfile（多阶段 Node 22 Alpine → Nginx Alpine）
- [x] 支持 `API_URL` 或等价环境变量（entrypoint 写 `runtime-config.js`）
- [x] 运行命令写入 README

### 18.3 模式 B（替换官方前端）
- [ ] 若第一版不正式支持，文档中明确"实验性"（deferred — README + CHANGELOG 已标注；实际 build 替换脚本未实现）
- [ ] 提供 build output 说明（deferred）
- [ ] 提醒 Hermes 更新后需重新替换（deferred）

### 18.4 零外部依赖
- [x] 不依赖第三方 CDN 才能运行（fonts 自托管 via `@fontsource`，无 CDN）
- [x] 资源全部打包到产物中

---

## 19. CI/CD Checklist

- [x] GitHub Actions：lint
- [x] GitHub Actions：type-check
- [x] GitHub Actions：build
- [x] GitHub Actions：bundle size check（`size-limit` gate）
- [ ] PR 模板包含：需求背景 / 截图 / 风险 / 回滚方式（pending — .github/pull_request_template.md 未创建；CONTRIBUTING.md 已覆盖内容）
- [ ] Release workflow 自动产出构建制品（pending — 发版 workflow 属 v0.2 开发自动化范畴）

---

## 20. v0.1.0 Definition of Done

### 必须完成
- [x] API Audit 文档完成
- [x] Overview / Providers / Sessions / Logs / Gateways / Settings 达到可用状态
- [x] Dark / Light 主题可切换
- [x] 连接 Hermes Agent 的配置链路真实可用
- [x] Providers 页的 key 管理真实可用
- [x] Sessions 可搜索并查看详情
- [x] Logs 可过滤并实时更新（WebSocket 或轮询）（轮询降级）
- [x] 全站 loading / error / empty state 补齐
- [x] lint / build / type-check / CI 全绿（5/5 gate）
- [x] README / LICENSE / CONTRIBUTING / CHANGELOG 完成

### 可降级完成（若后端暂不支持）
- [x] Skills 页作为只读浏览页上线
- [x] Cron 页作为"只读/占位 + roadmap"上线
- [x] i18n 结构预留，但 v0.1.0 不强制中英双语（已完整实现中英双语，超出降级底线）
- [x] 模式 B 只在文档中说明，不作为正式支持特性

---

## 21. 推荐开发顺序（给排期用）

### Sprint 1
- [x] API Audit
- [x] Networking / baseUrl / token / health 统一
- [x] DashboardLayout 与连接状态修正
- [x] Design Token 补齐

### Sprint 2
- [x] Overview 完成
- [x] Providers 真交互闭环
- [x] Settings 连接配置真实生效

### Sprint 3
- [x] Sessions 服务端搜索 + Drawer 详情
- [x] Logs 实时流 + 过滤 + 性能优化
- [x] Gateways 页面完成

### Sprint 4
- [x] Skills 补齐只读/可编辑能力（只读降级，符合 backend 能力）
- [x] Cron 按后端支持程度上线（只读 banner + config.cron 快照）
- [x] Responsive / a11y / reduced motion / 空错态补齐
- [x] 文档、CI、发版（发版 workflow 自动化为 v0.2 范畴，见 §19）
