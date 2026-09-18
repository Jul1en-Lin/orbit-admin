# 参数新增与编辑

## Resolution

已交付参数新增与编辑操作及前后端契约对接，支持多行参数值原样提交，并在页面级测试中全量覆盖：

- **接口契约对接** (`src/api/argument.ts`):
  - 新增 `createArgument` 函数，调用 `POST /argument/add`，提交 `configKey`（参数键名/编码）、`name`（参数名称）、`value`（参数键值）及可选 `remark`（备注），成功返回新建记录自增 `number id`。
  - 新增 `updateArgument` 函数，调用 `POST /argument/edit`，提交 `configKey`、`name`、`value` 及可选 `remark`，按 `configKey` 定位记录，成功返回更新记录自增 `number id`。
- **新增与编辑交互界面** (`src/views/ArgumentListView.vue`):
  - 列表工具栏提供「+ 新增参数」按钮（`data-test="btn-add-argument"`）。
  - 表格操作列提供「编辑」按钮（`data-test="btn-edit-argument"`）。
  - 弹窗对话框（`data-test="argument-dialog"`）：
    - 模式「新增」：标题「新增参数」（`data-test="argument-dialog-title"`），`configKey`（参数键名）可编辑输入。
    - 模式「编辑」：标题「编辑参数」（`data-test="argument-dialog-title"`），`configKey` 设为只读并禁用（`readonly` 与 `disabled`），显示已有键名且不可篡改。
    - 字段 `name`（参数名称）：单行文本输入，支持编辑。
    - 字段 `value`（参数键值）：普通多行文本域（`<textarea rows="4">`），原样保留内部与前后的空白、换行与格式，不自动解析为 JSON、不自动去除格式内容。
    - 字段 `remark`（备注）：文本域输入（`<textarea rows="3">`），可选填写。
- **客户端校验与规则**：
  - `configKey`、`name` 与 `value` 必填且拒绝全空白输入，触发时分别展示单项校验提示（`data-test="error-config-key"`、`data-test="error-name"`、`data-test="error-value"`）。
  - 不增加契约外的字符集或长度上限。
  - 全表与弹窗严格不提供删除功能，亦不提供状态写入控件。
- **既有写入异常与交互语义沿用**（对照 29、30、31）：
  - **防重复与提交中锁定**：提交中按钮禁用并显示「提交中...」，取消按钮禁用，遮罩点击与 ESC 键无法关闭弹窗。
  - **失败数据留存**：接口失败（如 500 主键冲突或网络异常）时弹窗保持打开，已填内容原样留存，展示单次错误反馈条（`data-test="argument-error-message"`）。
  - **写入结果不确定处理**：超时或网络中止时保持弹窗打开并解锁按钮，提示「提交结果未确认，请先查询核实」，不进行自动重试。
  - **脏表单二次确认**：未修改表单直接关闭；有修改表单在取消、遮罩关闭或路由离开时触发「表单有未保存的修改，确定放弃吗？」二次确认。
  - **401 会话失效清理**：401 或会话过期时立即关闭弹窗并清理未提交数据，不弹出放弃确认框。
  - **成功后刷新规则**：
    - 新增成功后关闭弹窗，清空表单，重置回第 1 页并刷新参数列表。
    - 编辑成功后关闭弹窗，清空表单，保留在当前页刷新参数列表。
    - 写入成功但列表刷新失败时展示警告横幅（`data-test="create-refresh-warning"`），明确说明已保存成功但刷新失败，不误导重复提交。
- **页面级测试全覆盖** (`tests/argument-edit.test.ts`):
  - 13 项测试完整覆盖 API 传参、多行值原样提交保持、新增/编辑弹窗开启与字段渲染、编码只读锁定、全空白输入拦截、成功新增回第 1 页拉取、成功编辑保留当前页拉取、提交中防重复锁定、服务端失败反馈、超时不确定结果、刷新失败横幅、脏表单确认、401 会话失效清理及删除控件不存在性。
  - 同步更新 `tests/argument-list.test.ts` 中的操作列断言（由占位文本升级为编辑按钮）。
- **质量门禁**：
  - `corepack pnpm test` 与 `corepack pnpm run check`（Prettier、ESLint、vue-tsc、Vitest 21 个测试套件 171 项测试、Vite 生产构建）全数通过，零警告零报错。
