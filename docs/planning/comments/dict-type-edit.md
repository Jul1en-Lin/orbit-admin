# 字典类型新增与编辑

## Resolution

已交付字典类型新增与编辑操作及前后端契约对接，并在页面级测试中全量覆盖：

- 遵循后端接口契约：
  - 在 `src/api/dict.ts` 中新增 `createDictType`，调用 `POST /dictionary_type/add`，提交 `typeKey`、`value` 及可选 `remark`，返回自增 `Long id`（前端接收为 `number`）。
  - 在 `src/api/dict.ts` 中新增 `updateDictType`，调用 `POST /dictionary_type/edit`，按 `typeKey` 定位记录，更新 `value` 及可选 `remark`，返回 `Long id`。
- 在 `src/views/DictTypeListView.vue` 交付新增与编辑交互界面：
  1. 列表操作栏提供「+ 新增字典类型」按钮（`data-test="btn-add-dict-type"`）。
  2. 表格操作列提供「编辑」按钮（`data-test="btn-edit-dict-type"`）。
  3. 弹窗对话框（`data-test="dict-type-dialog"`）：
     - 模式「新增」：标题「新增字典类型」，`typeKey`（字典类型编码）可编辑输入。
     - 模式「编辑」：标题「编辑字典类型」，`typeKey` 字段为只读/禁用（`readonly` 与 `disabled`），显示已有编码且不可篡改。
     - 字段 `value`（字典类型名称）：文本输入，支持编辑。
     - 字段 `remark`（备注）：文本域输入，可选填写。
  4. 客户端校验：
     - `typeKey` 与 `value` 严格拒绝空或全空白输入，触发时分别展示单项提示（`data-test="error-type-key"`、`data-test="error-value"`）。
     - 不添加未契约的正则、字符集或长度限制。
  5. 边界保护与不提供项：
     - 不提供删除按钮或接口调用，不提供状态（启用/停用）修改控件。
  6. 既有写入语义：
     - **防重复与提交中锁定**：提交中保存按钮展示「提交中...」并禁用，取消按钮与弹窗关闭（包括遮罩点击与 ESC 键）均被禁用锁定。
     - **明确失败反馈**：接口失败时保留用户当前已填写的表单内容，弹窗不关闭，展示单次错误反馈条（`data-test="dict-type-error-message"`）。
     - **成功关闭与刷新**：
       - 新增成功：关闭弹窗，清空表单，重置 `pageNo` 为 1 并重新拉取列表。
       - 编辑成功：关闭弹窗，清空表单，保留当前 `pageNo` 并重新拉取列表。
- 交付完整测试集 `tests/dict-type-edit.test.ts`（共 8 项测试），全仓 15 个测试文件 107 项测试全部通过：
  - API 函数层：覆盖 `createDictType` 与 `updateDictType` 的请求方法、URL、参数构建与返回值。
  - a) 打开新增弹窗，验证字段渲染与编码/名称全空白客户端校验。
  - b) 新增成功路径：调用 `POST /dictionary_type/add`，关闭弹窗，页码重置回第 1 页并重新查询。
  - c) 打开编辑弹窗：验证编码预填且只读锁定，名称与备注预填，编辑名称并验证空值校验。
  - d) 编辑成功路径：调用 `POST /dictionary_type/edit`，关闭弹窗，页码保持当前页并重新查询。
  - e) 提交中锁定（按钮禁用、关闭阻止）、后端业务失败与网络异常保留输入并展示单次错误提示。
  - f) 确认列表与弹窗均无删除按钮或状态写入/编辑控件。
- 质量门禁全数通过：`npm run check`（Prettier、ESLint、vue-tsc、Vitest、Vite 构建零警告零报错通过）。
