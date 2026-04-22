# Screenshots · 截图

Screenshots used in the project README. Generated with headless Chrome against a live Hermes Agent v0.9.0.

本目录存放 README 引用的截图，用 Chrome headless 对接真实运行的 Hermes Agent v0.9.0 自动生成。

## Naming convention · 命名规范

| File                    | Page route          | Description                                 |
| ----------------------- | ------------------- | ------------------------------------------- |
| `overview.png`          | `/overview`         | KPIs, activity chart, cost, platforms       |
| `chat.png`              | `/chat`             | Chat view with streaming response           |
| `sessions.png`          | `/sessions`         | Split-pane session browser                  |
| `platforms.png`         | `/platforms`        | Gateway / messaging platform status grid    |
| `memory.png` *(TODO)*   | `/memory`           | Memory entries + user profile + personality |
| `skills.png`            | `/skills`           | Skills card grid with filter chips          |
| `tools.png` *(TODO)*    | `/tools`            | Tools + MCP servers                         |
| `schedules.png`         | `/schedules`        | Cron + costs                                |
| `settings.png` *(TODO)* | `/settings`         | Advanced settings                           |

All screenshots are captured at **1440 × 900**, Dark theme, EN locale.

全部截图在 **1440 × 900** · Dark 主题 · 英文语言下生成。

## Regenerating · 重新生成

Run the dev server and Hermes Agent first, then:

启动 dev server 和 Hermes Agent 后执行：

```bash
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
OUT=./docs/screenshots

for page in overview chat sessions platforms skills schedules; do
  "$CHROME" --headless=new --disable-gpu --hide-scrollbars \
    --window-size=1440,900 \
    --virtual-time-budget=10000 \
    --screenshot="$OUT/$page.png" \
    "http://localhost:5173/$page"
done
```

Replace the `CHROME` path for Linux (`google-chrome` or `chromium`) or Windows.

Linux / Windows 用户把 `CHROME` 路径换成对应的可执行文件即可。

## Contributing screenshots · 贡献截图

If you notice an out-of-date screenshot after a UI change, please regenerate it in a PR — keep image dimensions consistent so README layout stays intact.

如果 UI 改动后发现某张截图过期，请在 PR 中重新生成并替换 —— 保持分辨率一致，避免 README 排版错乱。
