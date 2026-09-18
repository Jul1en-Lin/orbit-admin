---
id: account-create-validation
title: 校验、防重复与失败反馈
parent: orbit-map
labels: ["wayfinder:task", "ready-for-agent"]
status: closed
assignee: Jul1en-Lin
order: 29
blocked_by: ["account-create-dialog"]
---

## Question

如何在提交前拦住无效输入、在提交中防止重复操作，并在明确失败后让工作人员修正后重试？

## Parent

[实现 Orbit Admin 首版前端脚手架](11-first-release-spec.md)。本票确立写入表单的通用交互语义。

## What to build

新增弹窗在提交前提示字段问题且不发出请求；提交期间不能重复提交也不能关闭弹窗；明确失败时保留已填内容并只反馈一次。

## Acceptance criteria

- [x] 提交前展示字段校验，无效输入不发送请求。
- [x] 提交中防重复提交，并禁止关闭弹窗。
- [x] 明确失败保留已填输入且只反馈一次。

## Blocked by

- [新增管理端账号与成功路径](28-account-create-dialog.md)

## Delivery notes

本票确立的写入语义是后续模块（[字典类型新增与编辑](34-dict-type-edit.md)、[字典项新增](36-dict-item-create.md)、[字典项编辑与备注限制](37-dict-item-edit.md)、[参数新增与编辑](39-argument-edit.md)）的先例，后续票只以页面级测试覆盖本模块字段契约，不重复建立，也不为共享潜力构造万能表单。只模拟 HTTP，不 mock 表单内部逻辑。
