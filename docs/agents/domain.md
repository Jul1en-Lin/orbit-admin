# 领域文档

工程技能在探索代码库时应如何消费本仓库的领域文档。

## 探索之前先读这些

- 仓库根目录的 **`CONTEXT.md`**；或
- 仓库根目录的 **`CONTEXT-MAP.md`**（若存在）——它指向每个上下文各自的 `CONTEXT.md`，读取与当前主题相关的每一个；以及
- **`docs/adr/`** —— 读取触及你即将改动区域的 ADR。

若这些文件不存在，**静默继续**。不要声张它们缺失，也不要主动建议创建。`/domain-modeling` 技能（经由 `/grill-with-docs` 与 `/improve-codebase-architecture` 抵达）会在术语或决策真正定案时惰性创建它们。

## 文件结构

本仓库为**单上下文**（根目录没有 `CONTEXT-MAP.md`）：

```
/
├── CONTEXT.md
├── docs/adr/
│   ├── 0001-<decision>.md
│   └── 0002-<decision>.md
└── src/
```

若将来出现多上下文（根目录出现 `CONTEXT-MAP.md`），则改为：

```
/
├── CONTEXT-MAP.md
├── docs/adr/                          ← 系统级决策
└── src/
    ├── <context-a>/
    │   ├── CONTEXT.md
    │   └── docs/adr/                  ← 上下文级决策
    └── <context-b>/
        ├── CONTEXT.md
        └── docs/adr/
```

## 使用术语表中的词汇

当输出要命名某个领域概念时（议题标题、重构提案、假设、测试名），使用 `CONTEXT.md` 中定义的术语，不要漂移到术语表明确避免的同义词。

若需要的概念尚未进入术语表，这是一个信号：要么你在发明项目不使用的语言（重新考虑），要么这里存在真实缺口（记下来，交给 `/domain-modeling`）。

## 标出 ADR 冲突

若你的输出与现有 ADR 矛盾，明确提出来，不要静默覆盖：

> _与 ADR-0007（事件溯源订单）矛盾——但这值得重新讨论，因为……_
