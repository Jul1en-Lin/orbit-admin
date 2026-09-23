# Orbit Admin 部署与使用说明

本文档提供 Orbit Admin 前端脚手架的开发启动、环境配置、统一检查、模板复用、生产部署及安全凭据边界说明。

---

## 1. 架构与部署模型

- **前后端分离与同机部署**：前端与后端服务分别构建与部署，生产环境采用单台云服务器上同一 Nginx 实例作为统一反向代理与静态托管入口。
- **纯静态托管**：前端构建产物为纯静态资源（HTML / JS / CSS / 静态资源文件），部署于 Nginx 静态根目录，无需在生产服务器上持续运行 Node.js 运行时进程。
- **统一 API 入口**：浏览器端统一通过同源相对路径 `/api` 发起请求：
  - **开发环境**：由 Vite 开发服务器内置代理捕获 `/api`，重写为 `/admin` 后转发至本地网关。
  - **生产环境**：由 Nginx `location ^~ /api/` 捕获，重写为 `/admin/` 转发至网关 upstream。
  - 前端业务逻辑与组件仅面向同源 `/api`，不直连后端业务微服务，也不在客户端代码中拼接具体微服务地址。

---

## 2. 环境要求与依赖安装

### 2.1 环境要求

- **Node.js**：`24.15.0`（通过 `.nvmrc` 或开发环境指定）
- **pnpm**：`12.4.2`（通过 Corepack 管理）

### 2.2 安装依赖

执行以下命令安装依赖，确保使用锁定文件以保证依赖版本一致性：

```sh
corepack pnpm install --frozen-lockfile
```

> **注意**：`--frozen-lockfile` 会严格校验 `pnpm-lock.yaml`，防止依赖隐式更新引入意外变更。

---

## 3. 开发启动与环境配置

### 3.1 启动本地开发服务器

```sh
corepack pnpm dev
```

默认开发服务器启动在 `http://localhost:18000`。

### 3.2 网关代理目标配置

Vite 开发代理默认将 `/api` 转发到 `http://127.0.0.1:18080`（网关默认本地端口）。若本地网关运行在其他端口或主机，请按如下步骤配置：

1. 复制环境变量示例文件：
   ```sh
   cp .env.example .env.local
   ```
2. 编辑 `.env.local` 文件，调整网关目标地址：
   ```ini
   VITE_GATEWAY_TARGET=http://127.0.0.1:18080
   ```

**代理转发行为说明**：
- 浏览器发起请求：`GET /api/sys_user/login/password`
- Vite 开发代理重写路径并转发：`http://127.0.0.1:18080/admin/sys_user/login/password`
- `.env.local` 已在 `.gitignore` 中忽略，不会提交至版本库。

---

## 4. 本地统一质量门禁检查

在提交代码或合并分支前，必须运行本地统一检查命令：

```sh
corepack pnpm run check
```

该命令依次执行以下 5 项门禁检查，任一步骤失败均会终止流程：

1. **代码格式检查 (`pnpm run format:check`)**：`prettier --check .` 确保所有文件符合代码格式规约。
2. **代码规范检查 (`pnpm run lint`)**：`eslint . --max-warnings 0` 严格静态代码分析，零警告容忍。
3. **类型系统检查 (`pnpm run typecheck`)**：`vue-tsc --noEmit` 执行 Vue 与 TypeScript 严格类型检查。
4. **自动化单元与集成测试 (`pnpm run test`)**：`vitest run` 运行全部测试用例（包括布局、会话管理、认证失效、管理端账号、字典、系统参数、开发代理以及 Nginx 托管规则测试）。
5. **生产打包构建 (`pnpm run build`)**：`vite build` 确保生产环境打包顺利完成且产物正常输出至 `dist/`。

亦可按需运行单项命令：
```sh
corepack pnpm test          # 仅运行测试
corepack pnpm typecheck     # 仅检查 TypeScript 类型
corepack pnpm lint          # 仅运行 ESLint 检查
corepack pnpm format        # 自动格式化代码
corepack pnpm build         # 仅执行打包构建
```

---

## 5. 模板复制与独立开发规范

Orbit Admin 设计为**开箱即用、无侵入绑定的纯静态管理端脚手架**：

- **无私有 CLI 依赖**：本项目不依赖任何私有脚手架 CLI 或外部代码生成器，标准的 npm/pnpm 即可驱动。
- **无模板自动升级机制**：本项目不设置向上游模板的自动拉取或同步绑定机制。下游业务系统复用时，将其作为初始模板复制即可。
- **复制复用步骤**：
  1. 复制整个工程目录，重命名为新的业务工程目录。
  2. 删除开发私有与生成产物目录：`node_modules/`、`dist/`、`.git/`、`.env.local`。
  3. 执行 `git init` 初始化下游业务专属版本库。
  4. 按照上述步骤执行 `corepack pnpm install --frozen-lockfile` 安装依赖。
  5. 下游项目完全独立掌控全部源代码、依赖与页面组件，后续演进与本脚手架无耦合。

---

## 6. 静态产物构建与 Nginx 部署托管

### 6.1 构建静态产物

```sh
corepack pnpm build
```

构建完成后，纯静态产物输出至 `dist/` 目录：
- `dist/index.html`：单页应用入口文件。
- `dist/assets/`：包含哈希指纹的 JavaScript 脚本、CSS 样式表及静态媒体资源。

### 6.2 Nginx 配置文件

仓库在 `deploy/` 目录下提供了生产就绪的配置示例：
- `deploy/nginx/orbit-admin.conf`：**站点/虚拟主机配置**（推荐部署至 `/etc/nginx/conf.d/orbit-admin.conf`）。
- `deploy/nginx.conf`：**完整 Nginx 主配置**（适用于 Docker 容器基础镜像或独立主机 `/etc/nginx/nginx.conf`）。

### 6.3 核心 Nginx 配置策略与规则说明

生产 Nginx 配置遵循以下三项核心规则：

#### 规则 1：HTML5 History 路由回退 (`location /`)
```nginx
location / {
    try_files $uri $uri/ /index.html;
    add_header Cache-Control "no-cache, no-store, must-revalidate";
    add_header Pragma "no-cache";
    add_header Expires "0";
}
```
- 前端路由采用 Vue Router HTML5 History 模式。当用户直接访问或在深层路由（如 `/accounts`、`/dicts`、`/arguments`、`/not-found` 等）刷新页面时，Nginx 捕获不到对应静态文件后自动回退返回 `index.html`。
- `index.html` 配置禁用强缓存，确保前端重新部署发版后，客户端浏览器刷新即可即时加载最新版本的应用入口。

#### 规则 2：静态资源 404 隔离与长期强缓存 (`location ^~ /assets/`)
```nginx
location ^~ /assets/ {
    try_files $uri =404;
    expires 1y;
    add_header Cache-Control "public, max-age=31536000, immutable";
    access_log off;
}

location = /favicon.ico {
    try_files $uri =404;
    access_log off;
    log_not_found off;
}
```
- Vite 构建输出到 `/assets/` 下的静态资源文件名带有编译哈希（如 `index-Cd1kD4T-.js`），配置 1 年强缓存（`immutable`），极大提升加载性能并减少带宽消耗。
- **关键隔离保障**：必须配置 `try_files $uri =404;`。当客户端请求不存在的样式或脚本文件时，Nginx **直接响应 HTTP 404**，严禁回退至 `index.html`。这从根本上杜绝了缺失的 JS/CSS 请求错误回退为 HTML 文本从而导致浏览器报错“Failed to load module script / MIME type mismatch”的隐患。

#### 规则 3：同源 API 网关反向代理与错误透传 (`location ^~ /api/`)
```nginx
upstream gateway_upstream {
    server 127.0.0.1:18080;
    keepalive 32;
}

location ^~ /api/ {
    proxy_pass http://gateway_upstream/admin/;
    proxy_http_version 1.1;
    proxy_set_header Connection "";
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;

    proxy_connect_timeout 30s;
    proxy_read_timeout 60s;
    proxy_send_timeout 60s;

    proxy_intercept_errors off;
}

location = /api {
    return 308 /api/;
}
```
- 前端发起的 `/api/xxx` 请求通过 `proxy_pass http://gateway_upstream/admin/;` 自动替换前缀为 `/admin/xxx` 转发至网关。
- `proxy_intercept_errors off;` 确保后端网关响应的任何状态码（如 400、401、403、404、500、502）原样穿透返回给前端应用处理，绝不被 Nginx 拦截更绝不会触发页面回退。
- `location = /api` 使用 308 永久重定向保留请求方法并重定向至规范路径 `/api/`。

---

## 7. 凭据与安全边界

- **浏览器可见信息原则**：前端是一个纯静态单页客户端。所有包含在前端代码库中、写入 `.env*` 变量（包括所有以 `VITE_*` 开头的环境变量）以及打包在 `dist/` 产物中的内容，在用户浏览器端均以纯文本公开可见。
- **严禁提交服务端秘密**：前端仓库严禁提交任何后端私钥、数据库凭据、JWT 签名密钥、短信网关密钥或未脱敏的服务端凭据。
- **生产连接信息与证书管理**：生产部署环境中的真实域名、HTTPS 证书、私钥以及后端网关内部通信拓扑，均属于基础设施环境配置，须通过受控运维渠道在生产服务器端进行配置与挂载，不存入也不检入前端代码库。

---

## 8. 当前验证状态与事实阻碍记录 (Status & Blockers)

在项目交付与维护中，必须清晰区分自动化验证与实际部署联调的边界，只记录客观事实：

### 8.1 已验证项目 (Verified)
- **代码规范与类型安全**：Prettier 格式检查、ESLint 规则分析、vue-tsc 严格类型检查全部通过。
- **自动化测试门禁**：Vitest 自动化测试套件全部通过（22 个测试文件，200 项测试），覆盖：
  - 登录流程、会话恢复、并发 401 失效清理与旧会话隔离。
  - 管理端账号查询、筛选、新增、校验防重、异常处理与脏检查。
  - 字典类型与字典项列表、分页、新增、编辑及往返导航。
  - 系统参数列表、分页、筛选、多行编辑与只读约束。
  - Vite 开发代理规则配置与自定义网关目标解析。
- **本地受控链路模拟**：通过 `tests/nginx-hosting.test.ts`（29 项测试）在本地受控 HTTP 服务器中模拟验证了 Nginx 配置语法、History 路由回退、`/assets/` 404 隔离、`/api/` 路径映射转发以及网关 404/500/502 错误透传不回退行为。
- **生产构建打包**：`corepack pnpm run build` 执行成功，静态文件及哈希资源正确产出。

### 8.2 未验收项目与事实阻碍 (Unverified & Blockers)
- **后端网关真实联调**：【未验收】
  - **事实状态**：当前本地环境未运行后端网关服务（本地 18080 端口未监听，服务不可达），云端环境目前亦未部署后端微服务。
  - **事实阻碍**：在后端网关与 Nacos 服务未启动的情况下，前端无法与真实网关建立 TCP 连接，无法实测真实网关的 CORS/OPTIONS 握手、真实加密密码登录、Token 刷新以及真实业务数据返回。
- **实际生产线上发布**：【未验收】
  - **事实状态**：云服务器尚未完成生产环境部署、域名绑定与 HTTPS 证书配置。
  - **授权与边界**：未获授权不更改共享基础设施、域名、证书或发布服务；在获得正式运维授权与线上发布指令前，不得擅自更改基础设施、域名解析记录、SSL 证书或发布线上服务。
  - **验收计划**：待后端服务与网关启动并具备访问条件后，按计划开展真实网关联调与线上生产部署验收；绝不将配置推导或受控测试视为真实联调已通过。
