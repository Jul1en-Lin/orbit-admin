# 新增管理端账号与成功路径

## Resolution

已交付从管理端账号列表新增账号的真实组件库弹窗、成功路径、契约对齐与完整自动化测试：

- 在 `src/api/account.ts` 中新增 `createAccount` API 函数与 `CreateAccountDTO` / `CreateAccountPayload` 类型：
  - 调用 `POST /sys_user/add_edit`，严格剔除 `userId` 字段，避免触发后端编辑分支。
  - 严格遵守密码契约：直接传输 1–20 位英文字母与数字明文，不复用登录的 AES Hex 加密转换，不臆加未经契约约定的额外格式或长度约束，不在日志或控制台中记录或泄露密码。
  - 支持可选 `remark` 字段，空白字符自动规整或忽略。
  - 成功返回创建的账号 ID（`number`）。
- 在 `AccountListView.vue` 中集成新增入口与弹窗交互：
  - 增加「+ 新增账号」触发按钮（`data-test="btn-create-account"`），放置在表格工具栏中。
  - 使用 Element Plus `ElDialog`（`class="account-create-dialog"`，内部容器 `data-test="create-account-dialog"`）承载表单，匹配 Orbit 典雅纸墨视觉体系。
  - 身份（`identity`）下拉选项（`data-test="create-form-identity"`）来自 `admin` 字典，状态（`status`）下拉选项（`data-test="create-form-status"`）来自 `common_status` 字典。初始均为空字符串（占位符「请选择身份」「请选择状态」），不默认赋予任何身份或状态，强制工作人员主动选择。
  - 包含手机号（`data-test="create-form-phone"`）、密码（`data-test="create-form-password"`，`type="password"`，`maxlength="20"`）、昵称（`data-test="create-form-nickname"`）以及可选备注（`data-test="create-form-remark"`）。
  - 当字典数据加载失败时，弹窗内展示提示横幅（`data-test="dialog-dict-alert"`）并禁用依赖字典的下拉框与提交动作，提供重试选项按钮（`data-test="dialog-dict-retry"`），重试成功后恢复选项选择与正常提交。
  - 创建成功后，明确关闭弹窗、重置表单字段，并刷新管理端账号列表至最新数据（保留既有查询参数，无分页动作）。
  - 取消按钮（`data-test="btn-cancel-create"`）与弹窗关闭回调均自动重置表单状态。
- 新增页面与接口测试 `tests/account-create-dialog.test.ts`，8 项测试全面覆盖：
  - API 客户端 `createAccount` 接口调用、防御性剥离 `userId`、可选备注处理及返回账号 ID。
  - 列表点击新增按钮打开弹窗、表单字段完整存在、身份与状态均非默认赋予需主动选择。
  - 成功提交数据（不传 `userId`）、弹窗关闭、表格刷新并展示新创建账号。
  - 密码明文传输与边界验证（1 位及 20 位英数字符），与登录 AES 转换严格区分。
  - 字典加载失败阻止提交、弹窗内重试机制以及恢复后的成功提交链路。

全套自动化检查已全数通过：`npm run check`（Prettier 格式校验、ESLint 零警告、vue-tsc 严格类型检查、Vitest 56 项测试全数通过及 Vite 生产构建打包成功）。
