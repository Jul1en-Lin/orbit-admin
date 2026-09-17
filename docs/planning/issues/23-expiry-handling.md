---
id: expiry-handling
title: 统一认证失效与旧会话隔离
parent: orbit-map
labels: ["wayfinder:task", "ready-for-agent"]
status: open
assignee: null
order: 23
blocked_by: ["session-restore"]
---

## Question

如何在并发请求、旧会话迟到响应和登录自身失败下，只让真正失效的那次认证错误影响当前会话？

## Parent

[实现 Orbit Admin 首版前端脚手架](11-first-release-spec.md)。本票落实会话失效的统一处理与隔离。

## What to build

当前会话出现并发认证失效时，工作人员只被清理、提示和跳转一次；属于旧会话的迟到响应不干扰重新登录后的新会话；登录接口自身的错误不触发会话过期流程。

## Acceptance criteria

- [ ] 当前会话的多个并发认证失效只清理会话、提示并跳转一次。
- [ ] 属于旧会话的请求无论成功或失败都不得覆盖或清除新会话；退出后的迟到响应不得恢复旧会话。
- [ ] 登录接口自身的错误留在登录表单，不触发会话过期跳转；其他请求失败仍按 HTTP 状态与业务 code 分类，同一次失败只反馈一次。

## Blocked by

- [刷新后自动恢复会话](22-session-restore.md)

## Delivery notes

请求层已有统一的认证头、成功解包与失败分类，本票在其上收敛认证失效的会话级行为。失效时不保留未提交表单、不重放写请求的页面级行为在[脏表单确认与失效清理](31-account-create-dirty.md)首次具备写入流程时验证。
