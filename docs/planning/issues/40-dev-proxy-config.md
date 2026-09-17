---
id: dev-proxy-config
title: 本地代理与构建时配置
parent: orbit-map
labels: ["wayfinder:task", "ready-for-agent"]
status: open
assignee: null
order: 40
blocked_by: ["session-restore"]
---

## Question

如何让浏览器经同源路径访问网关，并使开发与生产使用同一套路径语义与可配置的网关目标？

## Parent

[实现 Orbit Admin 首版前端脚手架](11-first-release-spec.md)。本票交付本地代理与配置边界，不授权实际部署。

## What to build

浏览器统一访问同源路径，本地开发代理将其替换为网关路径，网关目标可配置；配置在构建时确定，不引入运行时配置加载。

## Acceptance criteria

- [ ] 浏览器统一访问同源 `/api`；本地开发代理将其替换为网关路径，网关目标可配置。
- [ ] 采用构建时配置，不引入运行时配置加载器。
- [ ] 通过实际请求观察核实路径语义与认证头转发，不绕过网关直连业务服务。

## Blocked by

- [刷新后自动恢复会话](22-session-restore.md)

## Delivery notes

同源 `/api` 与 Bearer 认证头已在[登录并进入工作台](12-login-workbench.md)交付，本票补齐可配置的网关目标与路径替换。网关运行状态未核实时如实记录，不把配置推导当作已验证结论；生产目标在部署时另行核实。生产侧的静态托管由[验证独立部署链路](41-nginx-hosting.md)交付。
