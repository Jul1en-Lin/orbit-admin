---
id: nginx-hosting
title: Nginx 静态托管与路由回退
parent: orbit-map
labels: ["wayfinder:task", "ready-for-agent"]
status: open
assignee: null
order: 41
blocked_by: ["dev-proxy-config"]
---

## Question

如何在站点根路径托管静态产物、刷新深层页面仍能加载应用，且 API 与缺失资源不被回退成页面？

## Parent

[实现 Orbit Admin 首版前端脚手架](11-first-release-spec.md)。本票交付生产托管配置与可验证链路，不授权实际发布。

## What to build

维护者用 Nginx 在站点根路径托管静态构建产物并代理 API，刷新工作台深层页面可正常加载应用，请求 API 或缺失资源时不会被错误地回退成页面 HTML。

## Acceptance criteria

- [ ] 提供 Nginx 配置示例：站点根路径托管静态产物，路由使用 history 模式，并将同源 `/api` 代理到网关。
- [ ] 有效深层页面刷新可加载应用；API 请求与缺失静态资源不得回退为页面 HTML。
- [ ] 在可控本地环境验证静态产物、页面刷新、API 代理与错误资源响应；如使用模拟 upstream 仅用于证明转发规则，不冒充真实联调，不搭建完整模拟后端。

## Blocked by

- [本地代理与构建时配置](40-dev-proxy-config.md)

## Delivery notes

生产 upstream、域名与 HTTPS 未实测时保持未验收。真实网关可用且获准时的登录与刷新核实由部署说明票与[真实后端功能联调](44-backend-integration.md)承担。
