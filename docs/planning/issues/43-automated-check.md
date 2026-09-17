---
id: automated-check
title: 完整自动检查与后端可用性核实
parent: orbit-map
labels: ["wayfinder:task", "ready-for-agent"]
status: open
assignee: null
order: 43
blocked_by: ["expiry-handling", "redirect-and-404", "account-list-states", "status-dictionary", "account-create-validation", "account-create-uncertain", "account-create-dirty", "dict-type-paging", "dict-type-edit", "dict-item-create", "dict-item-edit", "argument-edit"]
---

## Question

如何在冻结依赖的前提下证明全部切片合起来仍通过统一检查，并弄清真实联调所依赖的后端是否可用？

## Parent

[实现 Orbit Admin 首版前端脚手架](11-first-release-spec.md)。本票是验收第一步，不替代各票自己的测试。

## What to build

维护者以冻结的锁文件安装依赖、执行完整统一检查并留下结果记录，同时核实本地后端及其依赖的当前运行状态，明确列出阻断真实联调的阻碍。

## Acceptance criteria

- [ ] 以冻结的锁文件安装依赖，运行完整统一检查并记录格式、Lint、类型、自动测试与生产构建的结果；不以单次构建成功宣称首版交付。
- [ ] 核实本地后端及其依赖的当前运行状态；缺少环境或凭据时列明阻碍并通过非仓库渠道获取，不在记录或输出中披露秘密。

## Blocked by

- [统一认证失效与旧会话隔离](23-expiry-handling.md)
- [回跳与 404 恢复入口](24-redirect-and-404.md)
- [列表状态与最新响应](26-account-list-states.md)
- [身份与状态字典读取](27-status-dictionary.md)
- [校验、防重复与失败反馈](29-account-create-validation.md)
- [写入结果不确定与刷新失败](30-account-create-uncertain.md)
- [脏表单确认与失效清理](31-account-create-dirty.md)
- [字典类型分页交互](33-dict-type-paging.md)
- [字典类型新增与编辑](34-dict-type-edit.md)
- [字典项新增](36-dict-item-create.md)
- [字典项编辑与备注限制](37-dict-item-edit.md)
- [参数新增与编辑](39-argument-edit.md)

## Delivery notes

环境缺失时如实记为未验收，不用模拟通过替代。
