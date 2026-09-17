# 议题追踪：本地 Markdown

本仓库的议题与规格以 Markdown 文件形式保存在 `docs/planning/`，不使用 GitHub、GitLab 或其他远程追踪系统，也不创建远程仓库。

## 约定

- **地图**：`docs/planning/map.md`，标签 `wayfinder:map`，承载 Destination / Notes / Decisions so far / Not yet specified / Out of scope。
- **子议题**：`docs/planning/issues/<NN>-<slug>.md`，从 `01` 编号，正文以 `## Question` 写明提问。front matter 字段：
  - `id`：稳定标识，用于引用与依赖边
  - `title`
  - `parent`：所属地图 id（`orbit-map`）
  - `labels`：`wayfinder:<type>`（`research` / `prototype` / `grilling` / `task`）
  - `status`：`open` / `closed`
  - `assignee`：认领者身份，`null` 表示未认领
  - `order`：同层排序
  - `blocked_by`：阻塞它的议题 `id` 列表
- 向用户展示时使用标题链接，不使用裸编号。
- 每个议题的资产以链接引用，不粘贴进正文；并行工作时修改前重新读取地图，避免覆盖其他会话。

## 技能说「发布到议题追踪」时

在 `docs/planning/issues/` 下新建编号文件（必要时先建目录），写入 `## Question`，再补依赖边。

## 技能说「获取相关工单」时

读取所指路径的文件。用户通常会直接给出路径或议题编号；按编号定位时读取文件名前缀为 `<NN>-` 的文件，并以 front matter 的 `id` 作为稳定标识。

## wayfinding 操作

供 `/wayfinder` 使用。**地图**是一份文件，每个**子议题**是一个文件。

- **阻塞**：`blocked_by` 列出依赖议题的 `id`；此追踪系统无原生依赖，依赖边存于 front matter。所有依赖关闭才算解除阻塞。
- **frontier 查询**：扫描 `docs/planning/issues/`，筛选 `status: open`、`assignee: null`、且 `blocked_by` 中所有议题均为 `closed` 的议题，按 `order` 排序，取最靠前的一个。
- **认领**：将 `assignee` 改为实际驱动者身份并保存，这是开始工作前的第一次写入。
- **解决**：在 `docs/planning/comments/<id>.md` 追加 Resolution 评论，将 `status` 改为 `closed`，再在 `map.md` 的 Decisions so far 追加标题链接与一句摘要。Question 不改成答案。

## 范围与提问

- 可明确提问的事项进入议题；尚无法明确提问的进入地图的 Not yet specified。
- 超出范围的议题关闭并链接到 Out of scope，不记入 Decisions so far。
