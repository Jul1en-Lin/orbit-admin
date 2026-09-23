# 1. 依托 Framework-Java 流水线与同源 Web 容器托管前端

## Context

Orbit Admin 生产环境运行于单机云服务器。该服务器的生命周期、安全组、中间件容器及后端四个微服务均由 `Jul1en-Lin/Framework-Java` 统一编排并持有唯一的 `production` 环境机密（包含服务器 SSH 私钥及部署根目录）。宿主机上的 `frameworkjava-webprd`（Nginx 1.24）容器已映射主机 8666 端口，并挂载宿主机目录 `app/nginx/web/dist` 作为 Web 根路径。

## Decision

我们决定将 Orbit Admin 的生产发布与部署工作流收敛于 `Framework-Java` 仓库（`.github/workflows/release-web-prd.yml`），而非在前端仓库独立维护生产 CI 凭据：

1. **跨仓库检出构建**：工作流在 Runner 上直接检出公开的 `orbit-admin` 指定 Git ref，执行类型与语法检查后完成 `pnpm build` 打包。
2. **复用生产对象存储中转通道**：构建产物通过国内 OSS 预签名机制传输并对齐两端 SHA-256 校验和，构建与部署机密零暴露在前端仓库。
3. **同源代理与 Inode 安全替换**：生产静态资源通过 `rsync -a --delete` 原地同步至宿主机目录，保持目录 Inode 不变，随后通知 Nginx 平滑重载；前端发起的 `/api/` 请求直接由该 Nginx 反向代理至网关 `/admin/`，实现完全同源通信。
4. **免回滚策略**：前端静态部署采用正向替换机制，不维护独立回滚逻辑；如需回退，直接触发上一稳定 Git ref 重新发布。

## Consequences

- **优势**：避免在多个公开仓库重复配置高危 SSH 凭据；无须为前端增设 Docker 容器，节省宝贵的单机内存（剩余约 1 GB）；彻底消除浏览器跨域限制。
- **代价**：生产上线的操作入口位于 `Framework-Java` 仓库，前端发版需在该仓库执行或通过授权脚本跨仓库调度。
