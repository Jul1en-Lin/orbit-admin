---
id: session-restore
title: 刷新后自动恢复会话
parent: orbit-map
labels: ["wayfinder:task", "ready-for-agent"]
status: closed
assignee: codex
order: 22
blocked_by: []
---

## Question

如何让刷新后的标签页自动确认当前管理端账号，并在服务异常时不被误判为认证失效？

## Parent

[实现 Orbit Admin 首版前端脚手架](11-first-release-spec.md)。本票落实刷新恢复路径，不改变登录表单自身的失败处理。

## What to build

带令牌刷新受保护页面时先显示加载状态，取得当前管理端账号后才进入业务页面；恢复遇到网络或服务端异常时保留令牌并可重试或返回登录；只有认证失效才清理会话。

## Acceptance criteria

- [x] 从会话存储恢复令牌后，取得当前管理端账号前展示加载状态，不加载业务页面内容。
- [x] 恢复遇到网络或服务端异常时保留令牌，提供重试与返回登录，不按失效流程清理。
- [x] 真正认证失效时清理令牌与当前管理端账号并返回登录；不以前端倒计时、轮询续期或新增刷新令牌决定失效。

## Blocked by

无，可立即开始。

## Delivery notes

会话存储、当前管理端账号初始化请求、加载门以及「重试确认账号／返回登录」入口已在[登录并进入工作台](12-login-workbench.md)交付，本票补齐刷新即恢复的路径并把它固化为页面级测试。`expires` 按毫秒时长理解。登录接口自身错误留在登录表单的行为归[统一认证失效与旧会话隔离](23-expiry-handling.md)。

实现结果见[Resolution](../comments/session-restore.md#resolution)。
