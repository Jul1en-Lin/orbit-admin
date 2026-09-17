---
id: page-test-harness
title: 抽取页面级测试初始化
parent: orbit-map
labels: ["wayfinder:task", "ready-for-agent"]
status: closed
assignee: codex
order: 21
blocked_by: []
---

## Question

如何让后续每个业务页面票都用同一套初始化从应用入口挂载真实路由、状态与请求层，而不必各自重建？

## Parent

[实现 Orbit Admin 首版前端脚手架](11-first-release-spec.md)。本票是预重构，不新增用户可见行为。

## What to build

后续业务页面票从集中的页面级测试初始化挂载应用入口、路由、状态与请求层，只在 HTTP 边界模拟响应；登录与会话测试改用同一初始化且覆盖不减少。

## Acceptance criteria

- [x] 页面级测试初始化集中存放并可跨测试文件复用：从应用入口挂载真实路由、状态与请求层，仅在 HTTP 边界模拟响应，不通过模块 mock 绕过被测行为。
- [x] 登录与会话测试改用该初始化，原有断言与场景不减少；完整统一检查通过。

## Blocked by

无，可立即开始。

## Delivery notes

现有登录测试已含可用的挂载方式，本票只做集中化，不引入浏览器端到端框架、不搭建完整模拟后端、不设覆盖率门槛。后续列表票（25、32、38）引用本票先例。

实现结果见[Resolution](../comments/page-test-harness.md#resolution)。
