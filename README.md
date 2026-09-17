# orbit-admin

面向 B 端管理场景的独立前端脚手架，服务现有 Framework-Java 后端。

## 开发

需要 Node `24.15.0` 和 pnpm `12.4.2`。首次安装依赖（使用锁文件）：

```sh
corepack pnpm install --frozen-lockfile
corepack pnpm dev
```

浏览器通过同源 `/api` 访问后端；Vite 开发代理将其转发到本地网关的 `/admin`。默认目标为 `http://127.0.0.1:18080`，可将 `.env.example` 复制为 `.env.local` 后设置 `VITE_GATEWAY_TARGET`。网关目标只在代理配置中调整，不直连业务服务。

## 检查

```sh
corepack pnpm check
```

该命令依次执行格式检查、Lint、严格类型检查、测试和生产构建。也可以分别运行 `corepack pnpm test`、`corepack pnpm typecheck` 或 `corepack pnpm build`。

当前已交付登录、当前管理端账号识别、工作台布局和本地退出。业务列表入口会在对应功能交付后开放；真实网关登录和浏览器人工验收尚未执行。
