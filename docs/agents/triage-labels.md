# 分诊标签

工程技能用五个规范的分诊角色表达意图。下表把角色映射到本仓库追踪系统实际使用的标签字符串。

| mattpocock/skills 中的标签 | 本仓库追踪系统中的标签 | 含义 |
| -------------------------- | ---------------------- | ---- |
| `needs-triage`             | `needs-triage`         | 维护者需要评估此议题 |
| `needs-info`               | `needs-info`           | 等待报告者补充信息 |
| `ready-for-agent`          | `ready-for-agent`      | 规格完整，可交给 AFK 代理 |
| `ready-for-human`          | `ready-for-human`      | 需要人工实现 |
| `wontfix`                  | `wontfix`              | 不予处理 |

本仓库使用本地 Markdown 追踪系统，因此这些标签以议题 front matter 的 `labels` 条目记录，与 `wayfinder:*` 标签并存。技能提到某个角色时（例如「打上 AFK-ready 分诊标签」），使用右列对应的字符串。

若要改用其他词表，直接编辑右列。
