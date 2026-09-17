---
id: dict-type-edit
title: 字典类型新增与编辑
parent: orbit-map
labels: ["wayfinder:task", "ready-for-agent"]
status: open
assignee: null
order: 34
blocked_by: ["dict-type-list"]
---

## Question

如何让工作人员在字典类型列表上新增和编辑类型，并在编辑时明确编码不可更改？

## Parent

[实现 Orbit Admin 首版前端脚手架](11-first-release-spec.md)。本票落实字典类型维护，不包含字典项维护。

## What to build

工作人员通过弹窗新增字典类型，或对已有类型修改名称与备注；编辑时编码只读并以此定位记录；成功后列表刷新并显示最新结果。

## Acceptance criteria

- [ ] 新增提交编码、名称与可选备注；编辑按编码定位且编码只读。
- [ ] 编码与名称拒绝全空白；不添加契约外的字符集或长度约束。
- [ ] 不提供删除或状态写入。
- [ ] 新增与编辑遵循既有写入语义：提交中防重复且禁止关闭、明确失败保留输入且只反馈一次、成功关闭并刷新；新增后回第一页且不保证新增记录出现在第一页，编辑保留当前页。

## Blocked by

- [字典类型列表与筛选](32-dict-type-list.md)

## Delivery notes

写入交互语义先例见[校验、防重复与失败反馈](29-account-create-validation.md)、[写入结果不确定与刷新失败](30-account-create-uncertain.md)、[脏表单确认与失效清理](31-account-create-dirty.md)，本票不重复建立，只以页面级测试覆盖本模块的字段契约、只读规则与页码刷新规则。字典项维护尚未交付时，不提供失效入口，也不用伪造数据冒充可用功能。
