# 管理端账号列表查询与筛选

## Resolution

已交付管理端账号默认业务页、精确筛选与重置及完整页面级测试：

- 新增 `src/api/account.ts`，定义 `SysUserVO` 契约类型与 `fetchAccountList` 接口函数，调用 `POST /sys_user/list` 发送可选精确匹配字段（`userId`、`phoneNumber`、`status`），空筛选提交 `{}`，返回原生数组，不添加前端分页或排序。
- 新增 `src/views/AccountListView.vue`，采用 B 顶栏分栏工作台视觉（深墨绿背景、暖白正文、橙色操作按钮、细线分区与右侧操作边界说明栏），表格展示 ID、手机号、昵称、身份、状态及完整折行备注；不提供编辑、删除、重置密码或停用入口。
- 筛选输入（账号 ID、手机号、状态下拉）在点击「查询 ↗」按钮或在输入框按回车时才应用请求；提供「重置」按钮清空输入并立即重新查询全部；离开并重新进入页面时重置为默认查询状态，不进行全局状态缓存。
- 在 `src/components/AppShell.vue` 启用顶栏导航中的「管理端账号」入口，指向 `/accounts` 并设置激活高亮；未交付的「字典」与「参数」入口保持禁用占位。在 `src/router/index.ts` 注册受保护的 `/accounts` 路由，并将默认根路径 `/` 指向 `/accounts`。
- 新增页面级测试 `tests/account-list-query.test.ts`，覆盖 4 项关键场景：默认业务页列表加载与无修改入口、点击/回车精确筛选、重置清空筛选、页面重新进入恢复默认状态。

自动检查已全数通过：`npm run check`（包含 Prettier 格式校验、ESLint 零警告、vue-tsc 严格类型检查、Vitest 36 项测试及 Vite 生产构建）。
