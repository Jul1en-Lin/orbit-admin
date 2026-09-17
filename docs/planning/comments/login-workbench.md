# 登录并进入工作台

## Resolution

已交付登录与工作台首个纵向切片：

- 创建 Vue 3 + Vite + TypeScript 工程，锁定 Node `24.15.0`、pnpm `12.4.2`，提供开发启动和统一 `check` 命令。
- 登录表单仅检查手机号和密码是否为空，支持回车提交、提交中防重复；失败保留输入并显示单一错误反馈。
- 使用 AES-128/ECB、UTF-8、PKCS#7（兼容 Java PKCS5Padding）及 Hex 输出转换登录密码；`hello` 公共向量为 `712da0890f36e7c845da44a6fe944543`。
- 请求层统一使用同源 `/api`、Bearer 认证头和 `code=200000` 响应解包；成功登录后先请求 `GET /sys_user/login/get_info`，取得当前管理端账号后才进入受保护工作台。
- 使用 sessionStorage 保存 `accessToken`；本地退出清除令牌和当前管理端账号。工作台采用深墨绿、暖白、橙色及细边框主题，未交付业务入口保持不可用，不展示虚构数据。
- `tests/login-workbench.test.ts` 从真实应用入口验证路由保护、登录请求、密码向量、当前账号初始化、错误保留、防重复、认证头和本地退出。

自动检查已通过：`corepack pnpm format:check`、`corepack pnpm lint`、`corepack pnpm typecheck`、登录测试和 `corepack pnpm build`。尚未执行真实网关/后端联调及桌面 Chrome、Edge 人工验收，因此这些项目仍为未验收；密码转换仅完成公共向量核对，未声称替代 HTTPS。
