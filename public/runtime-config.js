// Runtime-injected config. At Docker deploy time the entrypoint runs envsubst
// to replace this file with a real config. During local dev we ship dashboard
// defaults so session continuation against Hermes' api_server works without
// extra steps.
//
// CHAT_API_KEY must match `API_SERVER_KEY` in ~/.hermes/.env — the dashboard
// sends it as `Authorization: Bearer <key>` when hitting the 8642 chat API,
// and it's the gate that unlocks `X-Hermes-Session-Id` session continuation
// (see gateway/platforms/api_server.py line 672-686).
window.__HERMES_RUNTIME_CONFIG__ = window.__HERMES_RUNTIME_CONFIG__ || {
  API_URL: '',
  // Paste your Hermes API_SERVER_KEY here (generate one with
  // `openssl rand -hex 8`, put the same value in ~/.hermes/.env as
  // API_SERVER_KEY, then restart `hermes gateway run`).
  // Leave as "" if your gateway is started without API_SERVER_KEY — session
  // continuation will be disabled but one-shot chat still works.
  CHAT_API_KEY: '',
};
