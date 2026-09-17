# 列表状态与最新响应

## Resolution

已交付管理端账号列表的状态与竞态语义及完整页面级测试：

- 明确区分加载中（`data-test="state-loading"`）、空结果（`data-test="state-empty"`，提示「暂无数据」）与请求失败（`data-test="state-error"`）三种列表状态。
- 请求失败时停留在当前 `/accounts` 页面，不整页跳转，展示错误提示与「重试」（`data-test="state-retry"`）按钮；点击重试使用当前查询条件重新发起请求并在成功后恢复展示。
- 重新查询失败时清空旧数据并展示错误状态与重试入口，不将旧数据误作新结果展示。
- 引入请求序号递增机制（`querySeq`），在连续查询乱序返回时严格丢弃过期响应，只采纳最新一次请求结果。
- 表格容器保持横向滚动能力（`min-width: 640px` 与外层 `overflow-x: auto`），所有输入框与按钮添加统一 `:focus-visible` 橙色可见焦点指示，说明栏明确说明当前操作边界。
- 新增页面级测试 `tests/account-list-states.test.ts`，覆盖加载/空结果/失败重试、重新查询失败不留旧数据、乱序响应防覆盖、操作边界与键盘可达性 4 组核心场景。

自动检查已全数通过：`npm run check`（包含 Prettier 格式校验、ESLint 零警告、vue-tsc 严格类型检查、Vitest 40 项测试及 Vite 生产构建）。
