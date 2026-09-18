# 身份与状态字典读取

## Resolution

已交付管理端账号所用的身份与状态字典完整读取、展示映射、异常反馈与隔离机制，以及完整测试：

- 新增 `src/api/dict.ts`，定义 `DictDataVO`、`BasePageVO` 与参数类型；提供 `fetchDictDataPage` 对应分页公开接口 `GET /dictionary_data/list?typeKey=&value=&pageNo=&pageSize=`；实现 `fetchAllDictData` 逐页拉取直到最后一页（`pageNo >= totalPages` 或列表为空），避免将第一页误作完整选项；提供 `fetchAccountDictionaries` 并行获取 `admin` 与 `common_status`。
- 在 `AccountListView.vue` 中接入字典读取与展示逻辑：
  - 状态筛选下拉框（`data-test="filter-status"`）根据 `common_status` 字典项以 `dataKey` 对应选项值、`value` 对应文本进行动态渲染，保留默认「全部状态」（空字符串），去除任何硬编码。
  - 表格行中通过 `admin` 字典将 `identity` 映射为可读文本，通过 `common_status` 字典将 `status` 映射为可读文本。
  - 遇到未知编码或字典项缺失时，优雅兜底显示原始编码，绝不丢弃记录，也不使用臆造的默认值替代。
  - 严格隔离账号本身的字符串状态（如 `'enable'` / `'disable'`）与字典项自身的数值状态（如 `status: 1`），匹配与下拉值均严格基于 `dataKey`。
  - 当字典加载失败时，顶部展示反馈横幅（`data-test="dict-alert"`），表格保留原始编码记录供工作人员继续查阅，横幅提供独立「重试字典」按钮（`data-test="dict-retry"`），同时整合表格「重试」机制。
- 新增页面与单元测试 `tests/status-dictionary.test.ts`，全面覆盖：
  - 字典分页接口逐页读取与全部页拉取逻辑。
  - `admin` 与 `common_status` 多页读取在表格和筛选下拉框中的完整映射展示。
  - 未知编码展示原始值且不丢失任何记录。
  - 字典加载失败的明确反馈与重试恢复。
  - 账号字符串状态与字典项数值状态的严格隔离。

自动检查已全数通过：`npm run check`（包含 Prettier 格式校验、ESLint 零警告、vue-tsc 严格类型检查、Vitest 48 项测试全数通过及 Vite 生产构建打包成功）。
