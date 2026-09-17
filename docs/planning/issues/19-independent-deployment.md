---
id: independent-deployment
title: 验证独立部署链路
parent: orbit-map
labels: ["wayfinder:task", "ready-for-agent"]
status: closed
assignee: null
order: 19
blocked_by: ["session-recovery"]
---

## Question

如何让独立构建的前端通过同源代理访问网关，并正确处理深层路由与缺失资源？

## Parent

[实现 Orbit Admin 首版前端脚手架](11-first-release-spec.md)。本票交付部署配置、可验证链路与使用说明，不授权实际发布。

## What to build

维护者可按说明构建静态前端，通过 Nginx 在站点根路径托管，刷新工作台深层页面且经同源 API 登录、恢复会话。模板可复制后独立开发，不要求生产持续运行 Node。

## Acceptance criteria

- [ ] 提供 Nginx 配置示例及构建、开发启动、环境配置、检查、复制复用和部署说明；前后端分别构建和部署，不新增自动升级模板机制。
- [ ] 浏览器统一访问 `/api`，本地 Vite 与生产 Nginx 将其替换为网关 `/admin`，网关再剥离一段前缀。通过请求观察核实路径语义与认证头转发，不直连业务服务。
- [ ] 采用构建时配置，不引入运行时配置加载器；网关目标在开发代理及 Nginx 中配置。Nacos 不是 API upstream，生产目标需部署时另行核实。
- [ ] 根路径部署、Router history 模式；有效深层页面刷新可加载应用，API 和缺失静态资源不得回退 HTML。
- [ ] 在可控本地环境验证静态产物、页面刷新、API 代理和错误资源响应；模拟 upstream 如有使用仅证明转发规则，不冒充真实网关联调，不搭建完整模拟后端。
- [ ] 真实网关可用且获准时核实登录、刷新会话及代理路径；不可用时明确标记未验收、阻碍和后续验证步骤。
- [ ] 浏览器可见配置视为公开信息；不写入服务端秘密，不重新提交已脱敏连接信息，实际凭据通过非仓库渠道提供。
- [ ] 记录实际执行命令与验证结果，区分构建通过、局部链路验证、真实联调及实际部署；未获授权不更改共享基础设施、域名、证书或发布服务。

## Blocked by

- [恢复会话与处理认证失效](13-session-recovery.md)

## Delivery notes

部署链路可基于登录和受保护工作台验证，不依赖全部业务页面。复用既有自动检查和会话测试；代理及静态路由以外部 HTTP 行为验证，不断言 Nginx 内部实现。生产 upstream、域名和 HTTPS 在实际部署准备阶段核实，不能以本地检查替代上线验收。

本票未实现，已拆分为更细的票：[40 本地代理与构建时配置](40-dev-proxy-config.md)、[41 Nginx 静态托管与路由回退](41-nginx-hosting.md)、[42 部署说明与凭据边界](42-deployment-notes.md)。拆分依据见[拆分记录](../comments/independent-deployment.md#resolution)。
