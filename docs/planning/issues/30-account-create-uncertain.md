---
id: account-create-uncertain
title: 写入结果不确定与刷新失败
parent: orbit-map
labels: ["wayfinder:task", "ready-for-agent"]
status: closed
assignee: Jul1en-Lin
order: 30
blocked_by: ["account-create-dialog"]
---

## Question

如何在写入结果未知或写入成功但列表刷新失败时，避免工作人员盲目重复保存？

## Parent

[实现 Orbit Admin 首版前端脚手架](11-first-release-spec.md)。本票落实部分成功与结果不确定的反馈边界。

## What to build

超时等未收到明确响应的提交保留输入、解除锁定并提示先查询核实，不自动重试；写入成功但刷新失败时两种结果分别说明。

## Acceptance criteria

- [x] 超时等未收到明确结果时保留输入、解除提交锁定，提示「提交结果未确认，请先查询核实」，不自动重试，不宣称绝对防重复写入。
- [x] 写入成功但列表刷新失败时分别说明两者，不诱导再次保存。

## Blocked by

- [新增管理端账号与成功路径](28-account-create-dialog.md)

## Delivery notes

断言可观察的提示文案、导航与请求次数。后端幂等能力不在前端承诺范围内。
