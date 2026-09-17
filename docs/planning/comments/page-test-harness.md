# 抽取页面级测试初始化

## Resolution

已完成页面级测试初始化的抽取与集中管理：

- 在 `tests/harness.ts` 集中提供 `mountApplication`、`httpMock` 和 `resetTestHarness`，从真实应用入口挂载路由、Pinia 状态及 Element Plus 组件，仅在 HTTP 边界模拟响应。
- `mountApplication` 支持路径字符串与配置对象，自动同步路由历史并提供强类型的 `router` 与 DOM `wrapper`。
- 在 `tests/setup.ts` 注册全局 `afterEach` 自动重置 HTTP 模拟请求历史、清理 sessionStorage 并重置 DOM 容器，避免测试间状态污染。
- `tests/login-workbench.test.ts` 迁移至集中初始化，原有 9 项测试场景与断言完整保留并通过；新增 `tests/harness.test.ts` 验证配置化挂载与跨文件重置能力。

自动检查已全数通过：`npm run check`（含 Prettier 格式、ESLint 零警告、vue-tsc 严格类型检查、Vitest 测试及 Vite 构建）。
