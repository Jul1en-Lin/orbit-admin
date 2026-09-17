# 回跳与 404 恢复入口

## Resolution

已交付回跳安全校验加固与 404 未知路由页面及完整页面级测试：

- 加固 `validRedirect` 校验逻辑（`src/views/LoginView.vue` 及 `src/auth/store.ts` 的 `handleSessionExpired`），除既有的单 `/` 开头与 `//` 协议相对拒绝外，新增拒绝包含反斜线 `\` 的路径（backslash bypass）和以 `/login` 开头的目标（避免回跳到登录页自身）。外部 URL（`https://…`）因不以 `/` 开头已被既有逻辑拒绝。非法目标静默按无目标处理，进入默认业务页，不以错误反馈泄漏目标内容。
- 新增 `src/views/NotFoundView.vue` 404 页面，显示「页面不存在」提示与「返回管理端首页」按钮，导航至默认业务页（workbench），视觉风格与登录页一致（深墨绿背景、暖白正文、橙色操作按钮）。
- 在 `src/router/index.ts` 添加 `/:pathMatch(.*)*` catch-all 路由，匹配所有未知路径并展示 NotFoundView，不引入缺少权限模型支撑的 403 流程。
- 新增页面级测试 `tests/redirect-and-404.test.ts`，涵盖 10 项场景：有效站内回跳、无目标默认页、协议相对目标拒绝、绝对外部 URL 拒绝、反斜线 bypass 拒绝、`/login` 自身回跳拒绝、非法目标内容不泄漏、未知路由显示 404、404 页提供返回默认页入口、404 页不含 403 流程。

自动检查已全数通过：`npm run check`（含 Prettier 格式校验、ESLint 零警告、vue-tsc 严格类型检查、Vitest 32 项测试及 Vite 构建）。
