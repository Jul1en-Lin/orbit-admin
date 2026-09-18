# Nginx 静态托管与路由回退：Resolution

## 已交付

- **Nginx 站点配置**：`deploy/nginx/orbit-admin.conf` 提供虚拟主机/站点级配置示例，配置根路径静态产物托管（`root /usr/share/nginx/html`、`index index.html`）与客户端请求限制。
- **Nginx 主配置**：`deploy/nginx.conf` 提供完整单机/容器化生产主配置示例，包含 events、http、gzip 压缩、upstream 及 server 块。
- **前端 History 模式路由回退**：`location /` 配置 `try_files $uri $uri/ /index.html`，支持深层页面（如 `/accounts`、`/dicts`、`/arguments`、`/not-found` 等）刷新正常回退并加载应用，配置入口 HTML 禁用强缓存（`no-cache, no-store, must-revalidate`）。
- **静态资源隔离与强缓存**：`location ^~ /assets/` 配置 `try_files $uri =404` 与 1 年 `immutable` 强缓存；文件缺失直接返回 404，严禁回退至 `index.html`，杜绝 HTML 当作 JS/CSS 解析的 MIME 错误。
- **单文件静态资源防回退**：`location = /favicon.ico` 配置 `try_files $uri =404`，缺失直接 404，不回退为 HTML。
- **API 代理与路径对齐**：`location ^~ /api/` 将前端同源 `/api/` 代理至网关 `http://gateway_upstream/admin/`，保持 URI 路径对齐（`/api/xxx` 转发为 `/admin/xxx`），并转发真实 IP 与请求头。
- **API 错误隔离不回退**：`proxy_intercept_errors off` 确保网关 404/502/500 等响应原样直达前端，独立 location 绝不执行 `try_files` 或回退至 `index.html`；`location = /api` 配置 308 重定向至 `/api/`。
- **本地受控环境验证与测试**：`tests/nginx-hosting.test.ts` 包含 29 项测试，全面覆盖配置文件结构与指令验证（括号平衡、upstream、root、index、try_files 404、proxy_pass、headers 等）以及通过受控本地 HTTP 服务器模拟 Nginx 调度逻辑对静态资源、深层路由回退、API 代理转发、参数透传与各类网关错误（404/500/502）响应不回退的端到端验证。

## 未验收

生产 upstream、域名绑定与 HTTPS 证书未实测时保持未验收。真实网关可用且获准时的登录与刷新核实由部署说明与真实后端功能联调承担。
