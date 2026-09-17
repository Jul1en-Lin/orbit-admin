---
id: redirect-and-404
title: 回跳与 404 恢复入口
parent: orbit-map
labels: ["wayfinder:task", "ready-for-agent"]
status: closed
assignee: codex
order: 24
blocked_by: ["session-restore"]
---

## Question

如何在未登录访问、认证失效和无效链接之后，让工作人员始终落到有效的站内页面？

## Parent

[实现 Orbit Admin 首版前端脚手架](11-first-release-spec.md)。本票落实回跳边界与未知路由恢复入口。

## What to build

未登录访问或认证失效后保留有效的站内目标，登录成功回到该目标；外部或非法目标不被接受，无从判断时进入默认页；未知路由给出明确的返回入口。

## Acceptance criteria

- [ ] 登录成功后回跳到有效的站内目标；没有目标时进入默认业务页。
- [ ] 拒绝外部目标与协议相对目标；非法目标按无目标处理，既不回跳也不以错误反馈泄漏目标内容。
- [ ] 未知路由显示 404 并提供返回默认页入口；不引入缺少权限模型支撑的 403 流程。

## Blocked by

- [刷新后自动恢复会话](22-session-restore.md)

## Delivery notes

回跳骨架（`redirect` 查询参数与仅接受单个 `/` 开头站内路径的校验）已在[登录并进入工作台](12-login-workbench.md)交付，本票补齐非法目标、无目标与 404 的页面级验证，不重做既有路径。
