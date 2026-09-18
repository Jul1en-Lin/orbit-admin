---
id: dict-item-create
title: 字典项新增
parent: orbit-map
labels: ["wayfinder:task", "ready-for-agent"]
status: closed
assignee: worker
order: 36
blocked_by: ["dict-item-query"]
---

## Question

如何在所属字典类型下新增字典项，并遵守编码、名称与排序的既有接口限制？

## Parent

[实现 Orbit Admin 首版前端脚手架](11-first-release-spec.md)。本票落实字典项新增。

## What to build

工作人员在字典项页新增一个选项，填写编码、名称及可选的整数排序与备注，成功后回到第一页并看到最新结果。

## Acceptance criteria

- [x] 新增提交所属类型、编码、名称、可选排序与备注。
- [x] 编码与名称拒绝全空白；排序有值时为整数，不限定正数；不附加契约外的字符集或长度限制。
- [x] 成功关闭弹窗并刷新列表，新增后回第一页。
- [x] 提交、失败与不确定结果的交互沿用既有写入语义。

## Blocked by

- [字典项查询与往返](35-dict-item-query.md)

## Delivery notes

写入交互语义先例见 29、30、31，本票只覆盖本模块的字段契约与整数排序规则。编辑分支与备注限制由[字典项编辑与备注限制](37-dict-item-edit.md)交付。
