# Hermes Dashboard 开发 Checklist（基于 PRD v2.0）

> 用途：把 PRD 拆成可执行开发项，供开发、联调、测试、发版逐项勾选。
> 建议使用方式：按 `P0 → P1 → P2 → P3` 顺序推进；每项完成后补充 issue / PR / 验收截图。

---

## 0. 先做的阻塞项（结合当前仓库现状，建议优先处理）

### P0 / Networking & Runtime Config
- [ ] 明确只支持哪种运行模式：
  - [ ] 模式 A：独立前端 + 代理 / 反向代理连接 Hermes API
  - [ ] 模式 B：替换 Hermes 官方前端静态产物
  - [ ] 第一版默认模式写入 README、CLI 帮助、Settings 文案
- [ ] 统一 `baseUrl` 的单一真相（single source of truth）
  - [ ] `Settings` 中保存的 Hermes API URL 能真正驱动所有请求
  - [ ] `/health`、`/api/*`、token 获取逻辑、React Query `queryKey` 全部使用同一 `baseUrl`
  - [ ] 切换 `baseUrl` 后自动清理旧缓存 / 重新拉取数据
- [ ] 明确 token / session 机制
  - [ ] 确认是否必须从 Hermes 根页面提取 session token
  - [ ] 确认该方案是否只在 dev proxy 下可用
  - [ ] 若正式支持 direct backend 模式，补齐不依赖 Vite dev proxy 的实现
- [ ] API Client 处理空响应与错误响应
  - [ ] 支持 `204 No Content`
  - [ ] 支持非 JSON 响应安全降级
  - [ ] 错误信息保留后端返回 body / message
  - [ ] 401/403 重试逻辑不会死循环

### P0 / 真实交互闭环
- [ ] 所有可点击控件必须满足“有真实行为或明确只读”
- [ ] Providers 页的 Add / Remove / Login / Disconnect 按钮全部接通真实 mutation，或改成只读展示
- [ ] Skills 页的 enable/disable 开关若 API 不支持，必须改成禁用态并说明“只读”
- [ ] Settings 页保存连接信息后，页面和全局状态立即刷新，不出现“保存成功但无实际效果”
- [ ] 全站 mutation 统一反馈：loading / success / error toast 或 inline message

### P0 / 工程红线
- [ ] `npm run lint` 通过
- [ ] `npm run build` 通过
- [ ] `tsc -b` 零错误
- [ ] CI 至少包含 lint + type-check + build

---

## 1. Phase 0 — API Audit

### 1.1 Hermes 版本与兼容性
- [ ] 明确最低支持 Hermes Agent 版本
- [ ] 记录已验证版本范围
- [ ] 输出兼容性矩阵到 README
- [ ] 若版本不兼容，前端给出明确错误提示

### 1.2 端点审计
- [ ] 审计 `GET /health`
  - [ ] 返回 schema
  - [ ] 认证要求
  - [ ] 超时 / 失败语义
- [ ] 审计 `GET /api/status`
  - [ ] Agent 基本信息字段
  - [ ] gateway 运行状态字段
  - [ ] 平台连接状态字段
  - [ ] 版本字段
- [ ] 审计 `GET/POST /api/config`
  - [ ] 支持的字段
  - [ ] 可修改字段与只读字段边界
  - [ ] 返回格式
- [ ] 审计 `GET/POST /api/env`
  - [ ] 字段说明、mask 规则、是否支持增删改
  - [ ] provider 分类与普通 env 分类规则
- [ ] 审计 `GET /api/sessions`
  - [ ] 分页 / limit / offset / search / source 参数
  - [ ] 排序规则
  - [ ] 每条 session 的字段完整性
- [ ] 审计 `GET /api/sessions/:id`
  - [ ] 详情字段
  - [ ] 是否含消息列表、tool 调用链、token 消耗
- [ ] 审计 `GET /api/sessions/:id/messages`
  - [ ] role / content / metadata schema
- [ ] 审计 `GET /api/skills`
  - [ ] category / source / enabled / usage_count 是否存在
  - [ ] 是否支持启用/禁用 mutation
- [ ] 审计 `GET /api/logs`
  - [ ] 过滤参数
  - [ ] 最大返回条数
  - [ ] 轮询建议间隔
- [ ] 审计日志 WebSocket（若存在）
  - [ ] URL
  - [ ] 鉴权方式
  - [ ] 消息 schema
  - [ ] 断线重连策略
- [ ] 审计 `GET/POST /api/cron`
  - [ ] CRUD 能力
  - [ ] 手动触发能力
  - [ ] pause/resume 能力
- [ ] 审计 Gateway 相关 API
  - [ ] 单独端点还是并入 status
  - [ ] 控制能力（connect/disconnect/restart）

### 1.3 审计输出物
- [ ] 产出 `docs/api-audit.md`
- [ ] 为每个端点记录：method、path、参数、响应 schema、认证、错误码、示例 payload
- [ ] 标注“PRD 已确认 / PRD 不支持 / 需产品降级”的字段
- [ ] 将最终 TS 类型同步到 `src/api/types.ts`

---

## 2. Foundation / App Shell

### 2.1 项目脚手架
- [ ] React 19 + TypeScript + Vite 版本锁定
- [ ] Tailwind CSS v4 配置可复现
- [ ] React Router 路由结构固定
- [ ] TanStack Query Provider、Zustand Store、全局样式在 `main.tsx` 正确注入

### 2.2 路由与布局
- [ ] 路由包含：Overview / Providers / Sessions / Skills / Logs / Cron / Gateways / Settings
- [ ] 404 路由跳回首页或独立 Not Found 页面
- [ ] DashboardLayout 支持桌面端固定侧边栏
- [ ] 移动端支持抽屉式导航
- [ ] 顶部右侧包含：主题切换、语言入口、Hermes 连接状态
- [ ] 底部包含版本号与 GitHub 链接

### 2.3 全局状态
- [ ] 主题状态持久化
- [ ] 语言状态持久化
- [ ] Hermes API URL 持久化
- [ ] 侧边栏展开/收起状态持久化（可选）
- [ ] 切换 Hermes API URL 时清理缓存并重新验证连接

### 2.4 Query / Fetch 基建
- [ ] 为所有查询设置统一 staleTime / refetch 策略
- [ ] 为实时数据设置轮询间隔（status / logs）
- [ ] 为 mutation 统一封装 optimistic update / invalidate / error handling
- [ ] 全局 Query Error Boundary / 页面级错误态明确
- [ ] fetch timeout / abort controller 统一处理

---

## 3. Design System / Token / 组件库

### 3.1 Tokens
- [ ] `tokens.css` 完整覆盖 PRD 中的 color / typography / spacing / radius token
- [ ] dark theme 完整实现
- [ ] light theme 完整实现
- [ ] token 命名与 PRD 一致或建立映射表
- [ ] 不在业务页面写死与 token 冲突的颜色值（除状态语义色外）

### 3.2 Typography & Layout Rules
- [ ] sans / mono 字体栈落地
- [ ] Metric 数字、日志、技术 ID 使用 mono
- [ ] 页面标题、section 标题、辅助文字层级统一
- [ ] 4px 网格系统可追溯

### 3.3 标准组件
- [ ] `StatusDot`
  - [ ] online / degraded / offline / unknown 4 态
  - [ ] `showLabel` 支持
  - [ ] reduced motion 下可降级
- [ ] `MetricCard`
  - [ ] default / loading / with-delta 变体
  - [ ] count-up 动画可开关
- [ ] `ProviderCard`
  - [ ] unconfigured / configured / connected / error 变体
- [ ] `GatewayCard`
  - [ ] disconnected / connected / error 变体
- [ ] `DataTable`
  - [ ] loading / empty / filtered / populated 4 态
  - [ ] sortable / selectable / row click 规则明确
- [ ] `LogLine`
  - [ ] DEBUG / INFO / WARN / ERROR 视觉规则一致
- [ ] `SideDrawer`
  - [ ] open / close 动画
  - [ ] ESC 关闭、点击遮罩关闭、focus trap
- [ ] `Badge`
  - [ ] success / warning / danger / info / neutral
  - [ ] outline / filled
- [ ] `SearchInput`
  - [ ] empty / focused / with-results
- [ ] `EmptyState`
  - [ ] 图标 + 文案 + CTA 规范
- [ ] `SkeletonLoader`
  - [ ] shimmer 动画统一
- [ ] `Button`
  - [ ] primary / secondary / ghost / danger
- [ ] `Tooltip`
  - [ ] 上下左右方向

### 3.4 组件文档
- [ ] 产出 `docs/components.md`
- [ ] 产出 `docs/design-system.md`
- [ ] 为核心组件补 props 说明、视觉状态、交互规则

---

## 4. 动效体系与可访问性

### 4.1 动效实现
- [ ] Slow pulse 用于 online 状态
- [ ] Fast pulse 用于 degraded 状态
- [ ] Border breathe 用于活跃 gateway
- [ ] Count-up 用于 MetricCard 数值变化
- [ ] Fade-in-up 用于列表项出现
- [ ] Slide-in 用于 SideDrawer
- [ ] Skeleton shimmer 用于加载中
- [ ] 循环动画数量不超过 PRD 性能护栏

### 4.2 Reduced Motion
- [ ] 全局支持 `prefers-reduced-motion`
- [ ] 所有循环动画可关闭或极限降级
- [ ] 日志滚动、抽屉展开、数字动画在 reduced motion 下不过度干扰

### 4.3 Accessibility
- [ ] 所有按钮、输入框、切换器有可访问名称
- [ ] 键盘可操作：Tab 顺序正确
- [ ] 行点击表格可被键盘聚焦和触发
- [ ] 抽屉使用 dialog 语义，支持 focus trap
- [ ] 不嵌套无效交互元素（如 button 内含 a）
- [ ] 色彩对比达标
- [ ] 屏幕阅读器能读出连接状态、错误信息、加载状态

---

## 5. Overview 页面 Checklist

### 5.1 数据接入
- [ ] Agent Status 卡片接入真实状态
- [ ] Messages 卡片接入“今日消息量”而非总消息量，若 API 不支持需定义降级口径
- [ ] Active Gateways 卡片显示“已连接 / 已配置”
- [ ] Skills 卡片显示“总数 + 今日新增”，若 API 不支持新增统计需明确定义降级

### 5.2 指标卡
- [ ] Agent Status 支持 Online / Offline / Degraded
- [ ] 支持显示运行时长或版本信息
- [ ] Messages 数字变化有 count-up 动画
- [ ] 状态点有语义动画

### 5.3 Gateway Status Grid
- [ ] 已启用平台按小卡片展示
- [ ] 已连接排前面，断连灰显
- [ ] 点击跳转 Gateway 页
- [ ] 卡片包含图标、名称、状态点

### 5.4 Recent Activity Feed
- [ ] 明确活动源数据：status 事件 / session 活动 / logs 抽样
- [ ] 至少展示最近 15 条
- [ ] 时间线格式统一
- [ ] 空状态文案明确

### 5.5 Provider 健康摘要
- [ ] 显示 provider 配置状态
- [ ] 若 API 支持，显示最近调用延迟 / 健康度
- [ ] 不支持时明确降级为“已配置 / 未配置”摘要

### 5.6 页面状态
- [ ] loading skeleton
- [ ] 错误态
- [ ] 空态
- [ ] 局部刷新不阻塞全页交互

---

## 6. Providers 页面 Checklist

### 6.1 信息架构
- [ ] 拆分为 `Connected Services` 与 `API Key Providers`
- [ ] 顶部包含搜索框
- [ ] 顶部包含状态过滤器：All / Configured / Unconfigured
- [ ] 已配置与未配置视觉上明显区分

### 6.2 Connected Services（OAuth / Device Code）
- [ ] 列出需 OAuth / Device Code 的 provider
- [ ] 展示连接状态
- [ ] 支持 Login / Reconnect / Disconnect
- [ ] 已连接卡片有绿色左边框或等价强调
- [ ] 显示最后连接时间或账户信息（若 API 支持）

### 6.3 API Key Providers
- [ ] 使用 2~3 列卡片网格
- [ ] 卡片显示：Provider 名称、Logo 占位、已配置 key 数量、Get Key 外链
- [ ] 已配置卡片有主色态边框
- [ ] 点击卡片展开行内面板或抽屉

### 6.4 Key 管理操作
- [ ] 支持 Add key
- [ ] 支持 Replace key
- [ ] 支持 Remove key
- [ ] 写入成功后列表立即刷新
- [ ] 错误时保留输入内容并提示失败原因
- [ ] 敏感值不回显，仅显示红acted / masked 值
- [ ] 外链跳转使用 `target="_blank" rel="noopener noreferrer"`

### 6.5 过滤与搜索
- [ ] 搜索命中 provider name 与 env key
- [ ] 状态过滤与搜索可叠加
- [ ] 无匹配结果时有空状态

### 6.6 安全与审计
- [ ] 输入框不自动填充真实 key 到 DOM 历史中（尽量控制）
- [ ] 不在日志中打印敏感 key
- [ ] mutation payload 只发必要字段

---

## 7. Sessions 页面 Checklist

### 7.1 顶部统计
- [ ] 总会话数
- [ ] 今日会话数
- [ ] 平均消息数 / 会话
- [ ] 总 Tool 调用次数
- [ ] 指标口径写清楚

### 7.2 数据表格
- [ ] 列包含：Title / Source / Model / Messages / Tools / Time
- [ ] 时间使用相对时间展示
- [ ] Source 使用平台图标或文字 fallback
- [ ] Model 使用 badge
- [ ] 支持 hover / selected 状态

### 7.3 搜索与过滤
- [ ] 支持文本搜索
- [ ] 支持平台过滤
- [ ] 优先使用服务端搜索与过滤，而不是先拉全量再本地过滤
- [ ] 搜索输入加 debounce
- [ ] 分页或 infinite loading 方案明确

### 7.4 详情 Drawer
- [ ] 点击行打开右侧 Drawer
- [ ] 展示完整消息列表
- [ ] 展示 Tool 调用链
- [ ] 展示 token 消耗
- [ ] 展示成本字段（若 API 支持）
- [ ] 支持关闭后回到原列表上下文

### 7.5 空错态
- [ ] sessions 加载中 skeleton
- [ ] 接口失败时显示错误而不是伪装成“无数据”
- [ ] 无 session 时显示 EmptyState

---

## 8. Skills 页面 Checklist

### 8.1 列表展示
- [ ] 卡片网格 3 列，响应式降到 2/1 列
- [ ] 每张卡显示：名称、描述、分类、使用次数、来源标识、开关/只读状态
- [ ] 描述两行截断

### 8.2 过滤能力
- [ ] 顶部搜索栏
- [ ] 分类标签过滤
- [ ] 来源过滤（若 API 有 source 字段）
- [ ] 搜索与过滤叠加

### 8.3 enable / disable
- [ ] 若 API 支持：
  - [ ] 支持启用/禁用 mutation
  - [ ] 切换时有 loading 态
  - [ ] 失败时回滚
- [ ] 若 API 不支持：
  - [ ] 开关改为禁用态
  - [ ] 页面明确标注“只读”

### 8.4 状态处理
- [ ] loading skeleton
- [ ] 错误态
- [ ] 无 skill 空态

---

## 9. Logs 页面 Checklist

### 9.1 展示形式
- [ ] 全宽终端风格视图
- [ ] 暗色背景 + mono 字体
- [ ] 高信息密度但可读
- [ ] 日志行格式统一为 `[HH:MM:SS] [LEVEL] [module] message`

### 9.2 工具栏
- [ ] DEBUG / INFO / WARN / ERROR 级别过滤
- [ ] 文本搜索
- [ ] Auto-scroll 开关
- [ ] 清空筛选 / 重置视图按钮（可选）

### 9.3 实时更新
- [ ] 优先 WebSocket
- [ ] 若无 WebSocket，则轮询降级
- [ ] 断线自动重连策略明确
- [ ] 新日志进入时，如果 Auto-scroll 打开，则滚动到底部
- [ ] Auto-scroll 关闭时不打断用户阅读位置

### 9.4 性能
- [ ] 限制默认日志条数（如最近 200/500 条）
- [ ] 大量日志时使用虚拟列表或窗口化
- [ ] 级别过滤优先走服务端参数
- [ ] 搜索优先走服务端参数（若可用）

### 9.5 视觉规则
- [ ] DEBUG 灰
- [ ] INFO 默认
- [ ] WARN 琥珀
- [ ] ERROR 红 + 左侧强调边框

---

## 10. Cron 页面 Checklist

### 10.1 列表表格
- [ ] 列包括：任务名称、Schedule、目标平台、状态、上次执行、下次执行
- [ ] Cron 表达式旁展示人类可读翻译
- [ ] 状态 badge：active / paused / error

### 10.2 CRUD 操作
- [ ] 新建任务弹窗
- [ ] 编辑任务弹窗
- [ ] 删除二次确认
- [ ] 暂停 / 恢复
- [ ] 手动触发

### 10.3 表单校验
- [ ] Cron 表达式合法性校验
- [ ] 必填字段校验
- [ ] 平台 / prompt / 时区字段规则明确
- [ ] 后端错误回显到表单层

### 10.4 状态反馈
- [ ] mutation loading 态
- [ ] mutation success 提示
- [ ] mutation error 提示
- [ ] 列表刷新与局部更新策略明确

### 10.5 若 Hermes v0.9.0 不支持
- [ ] 页面明确标注“等待后端 API 支持”
- [ ] 不做假交互
- [ ] 可保留只读占位与 roadmap 文案

---

## 11. Gateways 页面 Checklist

### 11.1 卡片网格
- [ ] 2~3 列响应式布局
- [ ] 每张卡包含：图标、名称、连接状态、最近活跃时间
- [ ] 已连接卡片有绿色左边框 + 状态点动画
- [ ] 断连卡片弱化显示

### 11.2 数据来源
- [ ] 明确平台列表来自 `/api/status` 还是独立 gateway API
- [ ] 排序规则：已连接优先，其次按最近活跃
- [ ] 平台 icon fallback 机制

### 11.3 交互
- [ ] 若 API 支持，提供 reconnect / disconnect / restart gateway 操作
- [ ] 若不支持控制，仅展示状态，不渲染可点击控制按钮

### 11.4 状态处理
- [ ] loading skeleton
- [ ] 错误态
- [ ] 无 gateway / 未启用空态

---

## 12. Settings 页面 Checklist

### 12.1 General
- [ ] 语言设置（若 v1 不做 i18n，则保留占位但不误导）
- [ ] 时区设置
- [ ] 设置持久化到 store / localStorage

### 12.2 Appearance
- [ ] Dark / Light 主题切换
- [ ] 强调色选择（若 v1 要做）
- [ ] 页面刷新后保留主题
- [ ] 跟随系统主题（可选）

### 12.3 Connection
- [ ] Hermes Agent API URL 输入框
- [ ] 保存后立即生效
- [ ] 保存后重新执行 health / status 检测
- [ ] 不可达时显示明确错误提示
- [ ] 支持恢复默认地址

### 12.4 Configuration
- [ ] 显示原始 `/api/config`
- [ ] 若 PRD 要求“查看/编辑”，则必须支持编辑能力；否则明确第一版只读
- [ ] 编辑模式有 schema / 表单或 JSON 编辑器策略
- [ ] 写回配置前有确认与错误提示

### 12.5 About
- [ ] Dashboard 版本号
- [ ] License
- [ ] GitHub 链接
- [ ] Hermes Agent 版本信息
- [ ] 兼容性说明

---

## 13. 响应式与适配 Checklist

### 13.1 桌面端
- [ ] ≥ 1280px 保持 PRD 的主布局体验
- [ ] 侧边栏 hover / click 展开行为稳定

### 13.2 平板端
- [ ] 卡片、表格、筛选工具栏不拥挤
- [ ] 2 列与 1 列断点合理

### 13.3 移动端
- [ ] 导航可用
- [ ] 表格允许横向滚动或卡片化降级
- [ ] Drawer / Modal 不溢出
- [ ] 输入与按钮触控尺寸合格

---

## 14. 错误态 / 空态 / 加载态 Checklist

### 14.1 每个页面都必须有
- [ ] 首屏 loading skeleton
- [ ] 请求失败提示
- [ ] 数据为空时 EmptyState
- [ ] 局部刷新与全页刷新区分

### 14.2 错误处理统一策略
- [ ] 网络错误
- [ ] 认证错误
- [ ] Hermes 未启动
- [ ] Hermes API 地址错误
- [ ] Hermes 版本不兼容
- [ ] 后端 schema 变更 / parse 失败

### 14.3 EmptyState 文案
- [ ] Providers 无配置
- [ ] Sessions 为空
- [ ] Skills 为空
- [ ] Logs 暂无日志
- [ ] Gateways 未运行
- [ ] Cron 无任务

---

## 15. 工程质量 Checklist

### 15.1 Type Safety
- [ ] 所有 API 响应有 TS 类型
- [ ] 不使用 `any` 逃避关键 schema
- [ ] 复杂派生数据提取为 selector / mapper

### 15.2 Code Structure
- [ ] 页面组件不承载过多 view-model 拼装逻辑
- [ ] 共用逻辑抽到 `lib/` 或 `api/` 层
- [ ] 避免在 JSX 中大量写内联样式状态机
- [ ] hover / active / selected 尽量回归 class/token 驱动

### 15.3 测试
- [ ] API client 单元测试
  - [ ] 204 响应
  - [ ] 401 重试
  - [ ] 非 JSON 错误
- [ ] Settings 切换 API URL 行为测试
- [ ] Providers add/remove key 行为测试
- [ ] Sessions drawer 打开/关闭测试
- [ ] Reduced motion 行为测试（可选）

### 15.4 Lint / Format
- [ ] ESLint 通过
- [ ] Prettier / Biome 策略统一
- [ ] Hooks 依赖正确
- [ ] 无未使用变量与死代码

---

## 16. 性能预算 Checklist

### 16.1 Bundle
- [ ] JS gzipped < 120KB（按 PRD 目标）
- [ ] CSS gzipped < 15KB
- [ ] 路由级按需加载（如必要）
- [ ] 图标按需引入

### 16.2 Runtime
- [ ] 首屏 FCP < 400ms（localhost 目标）
- [ ] LCP < 800ms（localhost 目标）
- [ ] Logs / Sessions 大列表滚动不卡顿
- [ ] 循环动画数量、will-change 使用量受控

### 16.3 数据请求
- [ ] 不做不必要全量拉取
- [ ] 搜索 / 过滤尽量服务端化
- [ ] 轮询间隔可配置
- [ ] 页面离开后停止不必要轮询

---

## 17. 文档与开源 Checklist

### 17.1 仓库文档
- [ ] README
  - [ ] 项目定位
  - [ ] 与官方 Dashboard 的差异
  - [ ] 安装方式（npm / Docker / 手动）
  - [ ] 配置方式
  - [ ] 截图 / GIF
  - [ ] 兼容性矩阵
- [ ] CONTRIBUTING.md
- [ ] CHANGELOG.md
- [ ] LICENSE（MIT）

### 17.2 开发文档
- [ ] `docs/design-system.md`
- [ ] `docs/components.md`
- [ ] `docs/api-audit.md`
- [ ] 本地开发环境说明
- [ ] 打包与发版说明

---

## 18. 分发与部署 Checklist

### 18.1 npm
- [ ] 包名确认可用
- [ ] CLI 启动命令确定
- [ ] 环境变量说明完整

### 18.2 Docker
- [ ] 提供 Dockerfile
- [ ] 支持 `API_URL` 或等价环境变量
- [ ] 运行命令写入 README

### 18.3 模式 B（替换官方前端）
- [ ] 若第一版不正式支持，文档中明确“实验性”
- [ ] 提供 build output 说明
- [ ] 提醒 Hermes 更新后需重新替换

### 18.4 零外部依赖
- [ ] 不依赖第三方 CDN 才能运行
- [ ] 资源全部打包到产物中

---

## 19. CI/CD Checklist

- [ ] GitHub Actions：lint
- [ ] GitHub Actions：type-check
- [ ] GitHub Actions：build
- [ ] GitHub Actions：bundle size check
- [ ] PR 模板包含：需求背景 / 截图 / 风险 / 回滚方式
- [ ] Release workflow 自动产出构建制品

---

## 20. v0.1.0 Definition of Done

### 必须完成
- [ ] API Audit 文档完成
- [ ] Overview / Providers / Sessions / Logs / Gateways / Settings 达到可用状态
- [ ] Dark / Light 主题可切换
- [ ] 连接 Hermes Agent 的配置链路真实可用
- [ ] Providers 页的 key 管理真实可用
- [ ] Sessions 可搜索并查看详情
- [ ] Logs 可过滤并实时更新（WebSocket 或轮询）
- [ ] 全站 loading / error / empty state 补齐
- [ ] lint / build / type-check / CI 全绿
- [ ] README / LICENSE / CONTRIBUTING / CHANGELOG 完成

### 可降级完成（若后端暂不支持）
- [ ] Skills 页作为只读浏览页上线
- [ ] Cron 页作为“只读/占位 + roadmap”上线
- [ ] i18n 结构预留，但 v0.1.0 不强制中英双语
- [ ] 模式 B 只在文档中说明，不作为正式支持特性

---

## 21. 推荐开发顺序（给排期用）

### Sprint 1
- [ ] API Audit
- [ ] Networking / baseUrl / token / health 统一
- [ ] DashboardLayout 与连接状态修正
- [ ] Design Token 补齐

### Sprint 2
- [ ] Overview 完成
- [ ] Providers 真交互闭环
- [ ] Settings 连接配置真实生效

### Sprint 3
- [ ] Sessions 服务端搜索 + Drawer 详情
- [ ] Logs 实时流 + 过滤 + 性能优化
- [ ] Gateways 页面完成

### Sprint 4
- [ ] Skills 补齐只读/可编辑能力
- [ ] Cron 按后端支持程度上线
- [ ] Responsive / a11y / reduced motion / 空错态补齐
- [ ] 文档、CI、发版

