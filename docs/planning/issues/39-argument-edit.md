---
id: argument-edit
title: 参数新增与编辑
parent: orbit-map
labels: ["wayfinder:task", "ready-for-agent"]
status: closed
assignee: worker
order: 39
blocked_by: ["argument-list"]
---

## Question

如何新增和编辑参数，并保证多行参数值不被自动解析或格式化？

## Parent

[实现 Orbit Admin 首版前端脚手架](11-first-release-spec.md)。本票落实参数写入。

## What to build

工作人员通过弹窗新增参数或编辑已有参数，值以普通多行文本原样提交；编辑时编码只读；成功后列表刷新为最新结果。

## Acceptance criteria

- [x] 新增与编辑提交编码、名称、值与可选备注；编辑编码只读。
- [x] 编码、名称与值必填且拒绝全空白；不增加契约外的字符集或长度上限。
- [x] 值使用普通多行文本，原样提交包括有效文本中的空白与换行，不自动解析或格式化。
- [x] 成功关闭并刷新，新增后回第一页、编辑保留当前页；不提供删除；写入异常行为沿用既有语义。

## Blocked by

- [参数列表与筛选](38-argument-list.md)

## Delivery notes

写入交互语义先例见 29、30、31，本票只覆盖本模块字段契约与多行值原样提交。
