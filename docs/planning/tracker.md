# 本地议题约定

用户指定在新仓库本地维护地图；不沿用后端仓库的 GitHub tracker。

- 地图：`map.md`，标签 `wayfinder:map`。
- 子议题：`issues/` 下的 Markdown，front matter 中 `parent: orbit-map`。
- 身份使用稳定 `id`；向用户展示时使用标题链接，不使用裸编号。
- 状态为 `open` / `closed`；`assignee: null` 表示未认领。开始工作前将 assignee 改为实际驱动者身份。
- 此 tracker 无原生依赖，用 `blocked_by` 存储依赖议题的 id。所有依赖关闭才算解除阻塞。
- frontier 查询：扫描子议题，筛选 open、assignee 为 null、所有 blocked_by 已关闭，按 order 排序。开放议题不复制到地图正文。
- 解决时在 `comments/<id>.md` 追加 Resolution 评论，再关闭议题，并在地图 Decisions so far 追加标题链接和一句摘要；Question 不改成答案。
- 新议题先创建，再写依赖边；可明确提问的事项进入议题，尚无法明确提问的进入地图 Not yet specified。
- 超出范围的议题关闭并链接到 Out of scope，不记入 Decisions so far。
- 每个议题的资产以链接引用，不粘贴入正文。并行工作时修改前重新读取地图，避免覆盖其他会话。
