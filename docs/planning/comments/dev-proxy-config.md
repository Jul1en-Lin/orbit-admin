# 本地代理与构建时配置：Resolution

## 已交付

- **Vite 开发代理**：`vite.config.ts` 通过 `loadEnv` 读取 `VITE_GATEWAY_TARGET`（默认 `http://127.0.0.1:18080`），将浏览器同源 `/api` 代理至网关并重写为 `/admin`（`changeOrigin: true`）。
- **API 客户端**：`src/api/client.ts` 的 `baseURL` 为 `/api`（同源相对路径），请求拦截器从 `sessionStorage` 取 `accessToken` 附加 `Authorization: Bearer <token>`。
- **构建时配置**：网关目标通过 Vite 环境变量在构建/开发时确定，无运行时配置加载器（不动态拉取 config.json 或 /api/config）。
- **环境示例**：`.env.example` 记录 `VITE_GATEWAY_TARGET=http://127.0.0.1:18080`。
- **测试**：`tests/dev-proxy-config.test.ts` 覆盖代理配置、路径重写语义、客户端 baseURL 与认证头、以及无运行时配置加载器。

## 未验收

第三条验收标准「通过实际请求观察核实路径语义与认证头转发」需要后端网关运行，属于人工联调验证，当前后端未启动，保留为未勾选。配置与代码层面的路径语义已通过测试核实。
