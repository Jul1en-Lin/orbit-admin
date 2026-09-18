# 部署说明与凭据边界：Resolution

## 已交付

- **完整部署与使用说明**：编写 `docs/deployment.md`，并在 `README.md` 中全面同步架构说明、特性清单、快速开始、代理配置、质量检查、模板复用、Nginx 部署及凭据边界。
- **环境要求与开发启动**：明确 Node.js `24.15.0` 与 pnpm `12.4.2` 要求，说明 `corepack pnpm install --frozen-lockfile` 锁文件安装机制与 `corepack pnpm dev` 本地启动流程。
- **构建时配置与代理对齐**：详述 `.env.example` 与 `.env.local` 中的 `VITE_GATEWAY_TARGET`（默认 `http://127.0.0.1:18080`），明确浏览器端始终使用同源 `/api`，由开发代理或生产 Nginx 统一转换至 `/admin`，前端应用不直连业务微服务。
- **本地统一质量门禁**：说明 `corepack pnpm run check` 统一门禁命令（Prettier 格式检查、ESLint 零警告静态检查、vue-tsc 严格类型检查、Vitest 自动化测试与 Vite 生产构建）。
- **模板复制与独立开发规范**：明确 Orbit Admin 纯静态脚手架定位，不依赖专有私有 CLI，不建立向上游模板的自动更新或升级绑定机制；下游项目通过复制源码、清理私有产物后完全独立演进。
- **Nginx 静态托管策略说明**：基于 `deploy/nginx/orbit-admin.conf` 与 `deploy/nginx.conf`，详述生产部署三大核心策略：
  1. HTML5 History 模式路由回退（`location /` 中 `try_files $uri $uri/ /index.html` 且入口 HTML 禁用强缓存）。
  2. 静态资源 404 隔离与长期强缓存（`location ^~ /assets/` 配置 `try_files $uri =404` 与 1 年 `immutable`，严禁回退至 `index.html` 避免 MIME 解析错误）。
  3. API 代理与错误原样透传（`location ^~ /api/` 转发至网关 `/admin/`，`proxy_intercept_errors off` 确保网关 404/500/502 等错误原样穿透）。
- **凭据与安全边界界定**：确立浏览器可见配置均为公开信息的边界原则，严禁在前端代码库中提交任何服务端秘密、私钥或凭据；生产真实网络与证书配置通过受控运维渠道提供。
- **自动化测试保障**：新增 `tests/deployment-notes.test.ts`（12 项测试），对部署文档的关键指令、配置策略、模板复用原则、凭据安全边界及事实阻碍记录进行严格断言；全套 23 个测试套件 212 项自动化测试全部通过。

## 未验收与事实阻碍

- **真实后端网关联调**：【未验收】当前本地环境后端网关（18080 端口）未监听且服务不可达，云端环境尚未部署后端微服务。缺乏可访问的真实网关导致 CORS/OPTIONS 握手、真实加密密码登录、Token 刷新等端到端人工链路未执行实测。
- **实际生产线上发布**：【未验收】云服务器尚未配置域名、HTTPS 证书与生产 Nginx 发布；未获授权不更改共享基础设施、域名、证书或发布服务。文档严守事实与阻碍记录，不将配置推导视为实测结论。
