# argument-list

## Resolution

已交付参数列表查询与筛选。

- 顶栏参数入口由不可用占位启用为 `router-link`，导航至 `/parameters`，主导航已无剩余禁用项。
- 参数查询调用 `GET /argument/list`，可选 `configKey`（精确匹配）和 `name`（包含匹配）筛选，支持 `pageNo`/`pageSize` 分页。
- 表格展示参数键名、参数名称、参数键值、备注及操作占位（新增与编辑参数由后续票交付）。
- 长文本值与备注列通过 `word-break: break-all; white-space: normal` 确保可完整查看，不被意外截断。
- 分页控件提供 10/20/50 每页选项（默认 10），切页/筛选/重置时 `pageNo` 归 1。
- 支持加载、空数据、错误重试状态区分，以及 `querySeq` 竞态丢弃过期响应。
- 重新进入页面时重置筛选、`pageSize` 与 `pageNo` 至默认状态。
- 不提供删除。
- 已更新 `dict-type-list` 和 `account-list-query` 测试中的禁用导航断言，与顶栏变更保持一致。
- 测试覆盖导航入口、初始加载、精确/包含筛选与重置、分页交互、状态切换与竞态丢弃、长文本渲染、返回恢复默认状态。
