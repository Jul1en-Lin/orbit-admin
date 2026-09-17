---
id: auth-session
title: 确定登录与会话失效交互
parent: orbit-map
labels: ["wayfinder:grilling"]
status: closed
assignee: lien
order: 3
blocked_by: [backend-contract]
---

## Question

基于核实的后端契约，登录字段、密码传输约定、token 存储与发送、刷新页面恢复、401 并发处理、站内回跳及退出如何设计？确认是否存在管理端服务端退出能力，区分本地清除与服务端失效；不将 C 端退出接口直接用于管理端。不添加验证码，不将浏览器端固定密钥加密视为保密措施或 HTTPS 的替代。

## Resolution

见[登录与会话失效讨论记录与最终决策](../comments/auth-session.md)。

## Assets

- [管理端认证源码核查](../assets/auth-contract.md)
