# 字典类型列表与筛选

## Resolution

已交付字典导航进入字典类型列表、编码精确与名称前缀筛选、状态与竞态语义及页面级测试：

- 在 `src/components/AppShell.vue` 中启用顶栏「字典」导航入口，指向 `/dictionaries` 并配置路由激活样式，移除占位与禁用状态。
- 在 `src/router/index.ts` 中注册受保护的 `/dictionaries` 路由，关联 `DictTypeListView` 视图组件，强制会话校验。
- 在 `src/api/dict.ts` 中定义 `DictTypeVO`、`DictTypeListParams` 契约类型及 `fetchDictTypeList` 请求函数，使用 query 参数（`pageNo`、`pageSize`、可选 `typeKey` 与 `value`）调用 `GET /dictionary_type/list`，返回 `Result<BasePageVO<DictTypeVO>>`。
- 新增 `src/views/DictTypeListView.vue`，延续深墨绿编辑风格与双栏工作台布局：
  1. **筛选表单**：提供字典类型编码（`typeKey`，精确匹配）与字典类型名称（`value`，前缀匹配）输入框；仅在点击「查询 ↗」或按回车键时应用查询；提供「重置」按钮清空筛选并重新以初始参数查询；离开并重新进入页面时重置为默认查询状态。
  2. **数据表格**：展示编码（`typeKey`）、名称（`value`）、状态（`status`：1 为启用，0 为停用，带对应徽标样式）、折行备注（长文本完整查看不截断）及操作列占位（「维护字典项」）。
  3. **状态与竞态处理**：沿用既有列表语义，包含加载中（`data-test="state-loading"`）、暂无数据（`data-test="state-empty"`）、加载失败及重试（`data-test="state-error"`、`data-test="state-retry"`）；利用单调递增 `querySeq` 丢弃迟到的过时响应，确保视图始终反映最新一次查询结果。
- 新增 `tests/dict-type-list.test.ts`，全量覆盖顶栏导航启用与路由跳转、初始分页与字段渲染、编码精确与名称前缀筛选、回车与重置、重新进入页面重置、加载/空/失败重试状态，以及并发请求迟到响应丢弃等场景。同步更新 `tests/account-list-query.test.ts` 中的顶栏禁用项断言。
- 质量门禁全数通过：`npm run check`（Prettier、ESLint 零警告、vue-tsc 严格类型检查、Vitest 13 个测试文件共 93 项测试全数通过、Vite 生产构建成功）。
