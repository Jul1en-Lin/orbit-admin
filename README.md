# orbit-admin

面向 B 端管理场景的独立前端脚手架，服务现有 Framework-Java 后端。

## 特性与交付功能

- **认证与会话治理**：AES Hex 兼容登录、受保护路由、会话持久化与刷新恢复、并发 401 收敛清理、旧会话延迟响应隔离及安全回跳控制。
- **工作台与视觉规范**：深墨绿编辑风格、顶栏导航与左右分栏工作台布局、404 异常页面及恢复入口。
- **管理端账号管理**：列表分页查询与精确筛选、动态身份与状态字典映射、新增弹窗格式校验、提交中防重复锁定、脏表单确认及不确定结果提示。
- **数据字典管理**：字典类型列表分页与编码/名称筛选、新增与编辑；字典项分页列表、新增与编辑（含清空备注限制）及类型间往返导航。
- **系统参数管理**：参数分页列表与编码/名称筛选、新增与编辑（支持多行参数值原样保留与全空白校验）。
- **独立部署与路由策略**：纯静态托管、HTML5 History 路由回退、`/assets/` 静态资源 404 隔离与同源 `/api/` 代理直连网关 `/admin/`。

---

## 快速开始

### 环境准备

项目依赖 Node.js `24.15.0` 与 pnpm `12.4.2`（推荐通过 Corepack 启用）：

```sh
corepack pnpm install --frozen-lockfile
corepack pnpm dev
```

开发服务器默认运行在 `http://localhost:5173`。

### 代理与环境配置

浏览器端统一通过同源 `/api` 发起请求，Vite 开发代理将其重写为 `/admin` 转发至本地网关。默认目标为 `http://127.0.0.1:18080`。

若需调整网关地址，复制 `.env.example` 为 `.env.local` 并配置：

```ini
VITE_GATEWAY_TARGET=http://127.0.0.1:18080
```

> **注意**：网关目标仅在代理层进行调度，前端应用面向同源 `/api`，绝不直接访问各业务微服务。

---

## 质量检查

运行项目统一质量门禁检查：

```sh
corepack pnpm run check
```

该命令将依次严格执行：

1. `pnpm run format:check`：Prettier 代码格式检查
2. `pnpm run lint`：ESLint 静态规则分析（零警告）
3. `pnpm run typecheck`：vue-tsc 严格类型检查
4. `pnpm run test`：Vitest 自动化测试套件
5. `pnpm run build`：生产环境打包构建

单独执行子命令：

- `corepack pnpm test`：运行自动化测试
- `corepack pnpm typecheck`：执行类型检查
- `corepack pnpm build`：打包生产产物至 `dist/`

---

## 模板复用与独立演进

Orbit Admin 是标准的纯静态前端工程脚手架：

- **无私有 CLI 工具**：使用标准 pnpm 工具链。
- **无模板自动升级机制**：不绑定上游仓库，避免非预期升级影响生产稳定性。
- **复用方式**：直接复制项目源码，删除 `.git`、`node_modules`、`dist` 与 `.env.local` 目录，执行 `git init` 即可作为全新的独立业务项目演进。

---

## 生产构建与 Nginx 部署

执行构建命令生成生产静态资源：

```sh
corepack pnpm build
```

产物输出至 `dist/` 目录。生产环境部署推荐使用 Nginx 作为统一反向代理与静态托管服务，核心配置文件位于：

- `deploy/nginx/orbit-admin.conf`：虚拟主机站点配置（推荐置于 `/etc/nginx/conf.d/`）
- `deploy/nginx.conf`：单机或容器化完整主配置文件示例

**核心部署策略**：

1. **History 模式路由回退**：`location /` 中配置 `try_files $uri $uri/ /index.html`，同时入口 HTML 禁用强缓存。
2. **静态资源 404 隔离**：`location ^~ /assets/` 配置 `try_files $uri =404` 与 1 年 `immutable` 强缓存。缺失文件必须直接 404，绝不回退至 `index.html`。
3. **API 代理与错误透传**：`location ^~ /api/` 配置 `proxy_pass http://gateway_upstream/admin/;` 且 `proxy_intercept_errors off;`，确保网关错误原样透传。

完整生产配置与部署指导详见 [部署与使用说明 (docs/deployment.md)](docs/deployment.md)。

---

## 凭据安全与验证状态

- **公开配置与凭据边界**：所有前端代码与 `VITE_*` 环境变量经构建后均在浏览器端完全公开可见。严禁向本仓库提交任何服务端私钥、数据库密钥或敏感凭据。生产环境证书与后端地址通过服务器运维通道安全配置。
- **当前验证边界**：
  - **已验证**：本地统一检查命令（格式、Lint、类型、全部 200 项测试用例及构建打包）已全部通过；本地受控 HTTP 模拟服务器已完成对 Nginx History 路由回退、`/assets/` 404 隔离、代理路径转换与错误透传的验证。
  - **未验收与事实阻碍**：当前环境后端网关（18080）未在本机启动或不可达，云端后端尚未部署；真实网关下的登录、跨域、会话刷新及生产部署未进行端到端人工实测，明确标记为「未验收」，绝不将配置推导视为实测通过。
