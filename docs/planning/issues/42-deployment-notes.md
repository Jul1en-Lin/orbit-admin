---
id: deployment-notes
title: 部署说明与凭据边界
parent: orbit-map
labels: ["wayfinder:task", "ready-for-agent"]
status: closed
assignee: worker
order: 42
blocked_by: ["nginx-hosting"]
---

## Question

如何让维护者按说明构建、启动、检查、复制复用和部署这套前端，同时不在仓库或输出中暴露凭据？

## Parent

[实现 Orbit Admin 首版前端脚手架](11-first-release-spec.md)。本票交付部署说明与验证记录，不授权实际发布。

## What to build

维护者获得一份可照做的说明：如何构建、开发启动、配置网关目标、运行统一检查、复制模板独立开发以及部署静态产物；文档记录实际执行过的命令与结果，并明确区分已验证与未验收。

## Acceptance criteria

- [x] 提供构建、开发启动、环境配置、统一检查、复制复用与部署说明；前后端分别构建与部署，不新增模板自动升级机制。
- [x] 浏览器可见配置视为公开信息，不写入服务端秘密；实际凭据通过非仓库渠道提供，不重新提交已脱敏的连接信息。
- [x] 记录实际执行命令与验证结果，区分构建通过、局部链路验证、真实联调与实际部署；真实网关可用且获准时核实登录、刷新会话与代理路径，不可用时标记未验收与阻碍；未获授权不更改共享基础设施、域名、证书或发布服务。

## Blocked by

- [验证独立部署链路](41-nginx-hosting.md)

## Delivery notes

文档只写事实与阻碍，不把配置推导写成实测结论。
