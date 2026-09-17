---
id: dict-item-edit
title: 字典项编辑与备注限制
parent: orbit-map
labels: ["wayfinder:task", "ready-for-agent"]
status: open
assignee: null
order: 37
blocked_by: ["dict-item-query"]
---

## Question

如何编辑已有字典项，并在接口不支持清空备注或所属类型变更时明确阻止而不是假装成功？

## Parent

[实现 Orbit Admin 首版前端脚手架](11-first-release-spec.md)。本票落实字典项编辑及其接口限制。

## What to build

工作人员编辑字典项时编码只读、所属类型固定，可修改名称、排序与备注；试图清空已有备注时被明确告知接口不支持，而不是提交后静默无效。

## Acceptance criteria

- [ ] 编辑提交编码、名称、可选排序与备注；编码只读，所属类型固定且不发送可变的所属类型。
- [ ] 清空已有备注时阻止提交并提示「当前接口不支持清空备注」，不以空格绕过。
- [ ] 不承诺把已有排序清空为 null，也不将无效清空呈现为已生效。
- [ ] 编辑成功保留当前页并刷新；不提供删除或状态写入；写入异常行为沿用既有语义。

## Blocked by

- [字典项查询与往返](35-dict-item-query.md)

## Delivery notes

写入交互语义先例见 29、30、31。断言以页面级测试覆盖备注限制与只读编码，不断言组件内部状态。
