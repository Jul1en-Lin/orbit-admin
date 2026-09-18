# 字典类型分页交互

## Resolution

已交付字典类型列表分页交互与前端状态管理，并在页面级测试中全量覆盖：

- 遵循后端分页契约：`GET /dictionary_type/list` 响应返回 `BasePageVO<DictTypeVO>`（仅包含 `totals`、`totalPages`、`list`，后端不返回 `pageNo` 与 `pageSize`）。由前端页面状态管理当前页码与每页条数：
  - `pageNo`：默认 1。
  - `pageSize`：默认 10，提供 10、20、50 可选项。
  - 正常表格只消费响应中的 `totals`、`totalPages` 与当前页 `list`，不新增前端排序或未契约分页字段。
- 在 `src/views/DictTypeListView.vue` 交付分页交互 UI：
  1. 容器（`data-test="pagination-wrap"`）采用编辑风格细边框与排版布局。
  2. 展示记录总数与总页数（`data-test="page-totals"`，如「共 25 条，共 3 页」）与当前页码（`data-test="page-current"`，如「第 1 / 3 页」）。
  3. 提供下拉选择器（`data-test="page-size-select"`），支持 10、20、50 条/页切换。
  4. 提供「上一页」（`data-test="page-prev"`）与「下一页」（`data-test="page-next"`）翻页按钮。
- 完整落实交互规则与边界语义：
  - **查询回首页**：点击「查询 ↗」或在筛选框按回车提交筛选时，将 `pageNo` 重置为 1 并发起请求。
  - **切页大小回首页**：改变每页条数时，将 `pageNo` 重置为 1，并立即以新 `pageSize` 重新发起查询。
  - **重置回首页**：点击「重置」清空筛选条件并将 `pageNo` 重置为 1 并重新查询。
  - **翻页与边界禁用**：点击上一页/下一页按更新后的页码请求数据；在第一页时上一页按钮禁用（`disabled`）；在末页（`pageNo >= totalPages`）或总页数为 0（`totalPages === 0`）时下一页按钮禁用；禁用状态下点击不触发多余请求。
  - **重新进入恢复初始**：离开页面（如进入工作台）再返回时，恢复默认筛选、`pageSize: 10` 与 `pageNo: 1`。
- 新增页面级测试 `tests/dict-type-paging.test.ts`，全量覆盖五项核心场景（99 项全仓测试全数通过）：
  - a) 默认 pageNo=1、pageSize=10，正确展示 totals 与 totalPages。
  - b) 切换页大小（10 -> 20 -> 50）重置 pageNo 为 1 并发送对应 pageSize 请求。
  - c) 上一页/下一页翻页更新 pageNo 并遵循第一页、末页及 0 记录的禁用状态。
  - d) 筛选提交与重置强制回到第一页。
  - e) 离开并重新进入页面恢复默认筛选、pageSize=10 与 pageNo=1。
- 质量门禁全数通过：`npm run check`（Prettier 格式化校验、ESLint 零警告、vue-tsc 严格类型检查、Vitest 14 个测试文件共 99 项测试全部通过、Vite 生产构建成功）。
