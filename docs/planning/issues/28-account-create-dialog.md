---
id: account-create-dialog
title: 新增管理端账号与成功路径
parent: orbit-map
labels: ["wayfinder:task", "ready-for-agent"]
status: open
assignee: null
order: 28
blocked_by: ["status-dictionary"]
---

## Question

如何从管理端账号列表新增一个账号，并让身份与状态由工作人员主动选择而不是默认赋予？

## Parent

[实现 Orbit Admin 首版前端脚手架](11-first-release-spec.md)。本票落实管理端账号新增的成功路径，不启用编辑分支。

## What to build

工作人员在列表中打开新增弹窗，主动选择身份与状态、填写资料后提交，成功后弹窗关闭且列表刷新为最新结果。

## Acceptance criteria

- [ ] 从列表打开新增弹窗，调用新增接口且不传用户 ID；身份、手机号、密码、昵称、状态必填，备注可选；不提供管理端账号编辑能力。
- [ ] 身份与状态来自完整字典选项且必须主动选择，不默认赋予身份；选项加载失败时可重试并阻止依赖选项的提交。
- [ ] 密码为 1–20 位英文字母或数字；不复用登录的密码转换，不新增契约外的格式或长度约束，不记录密码。
- [ ] 明确成功后关闭弹窗并刷新列表；非分页列表不增加分页动作。

## Blocked by

- [身份与状态字典读取](27-status-dictionary.md)

## Delivery notes

复用[管理端账号列表查询与筛选](25-account-list-query.md)与[列表状态与最新响应](26-account-list-states.md)的列表语义、[身份与状态字典读取](27-status-dictionary.md)的选项来源。使用真实组件库弹窗。提交中锁定、校验与失败反馈由[校验、防重复与失败反馈](29-account-create-validation.md)交付；本票只要求成功路径正确。
