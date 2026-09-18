---
id: account-create-dirty
title: 脏表单确认与失效清理
parent: orbit-map
labels: ["wayfinder:task", "ready-for-agent"]
status: closed
assignee: Jul1en-Lin
order: 31
blocked_by: ["account-create-dialog"]
---

## Question

如何在不打扰未修改表单的前提下，避免未提交的账号资料被取消、关闭或站内导航意外丢弃？

## Parent

[实现 Orbit Admin 首版前端脚手架](11-first-release-spec.md)。本票落实未提交表单的保护与失效清理。

## What to build

修改过的表单在取消、关闭或站内导航前确认放弃，未修改的可直接关闭；认证失效时直接清理，不保留未提交内容，也不重放写请求。

## Acceptance criteria

- [x] 修改过的表单在取消、关闭或站内导航时需确认放弃；未修改的表单可直接关闭。
- [x] 认证失效可直接清理，不保留未提交表单，且不重放新增或修改请求。
- [x] 不增加浏览器关闭拦截，也不持久化表单数据。

## Blocked by

- [新增管理端账号与成功路径](28-account-create-dialog.md)

## Delivery notes

「不重放写请求」在此首次具备页面级写入流程，因此在页面与 HTTP 边界验证；[统一认证失效与旧会话隔离](23-expiry-handling.md)只负责会话级清理。后续带表单的模块沿用同一语义。
