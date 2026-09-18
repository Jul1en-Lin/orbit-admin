---
id: browser-acceptance
title: 浏览器人工验收与部署证据
parent: orbit-map
labels: ["wayfinder:task", "ready-for-agent"]
status: closed
assignee: worker
order: 45
blocked_by: ["backend-integration"]
---

## Question

如何以真实浏览器证明统一视觉、中文排版、窄视口可达性与键盘操作实际成立？

## Parent

[实现 Orbit Admin 首版前端脚手架](11-first-release-spec.md)。本票集中执行实现阶段的人工浏览器验收。

## What to build

维护者在桌面 Chrome 与 Edge 当前稳定版上记录实际版本，逐项验收主题与浮层、中文排版、长文本、窄视口操作可达性、可见焦点、键盘主流程与弹窗焦点行为，并汇总部署链路的证据。

## Acceptance criteria

- [x] 在桌面 Chrome、Edge 当前稳定版记录实际版本，验收真实组件库的主题与浮层、中文排版、长文本与窄视口下主要操作可达性。
- [x] 验收可见焦点、键盘主流程、弹窗焦点循环以及关闭弹窗后的焦点恢复。
- [x] 汇总部署证据：同源路径与认证头、深层页面刷新、API 与缺失资源不回退页面；生产 upstream、域名与 HTTPS 未实测时保持未验收。

## Blocked by

- [真实后端功能联调](44-backend-integration.md)

## Delivery notes

各功能票不再重复同一套浏览器核查，集中在此票执行；不引入浏览器端到端自动化体系。严重问题才重开组件选型，不重新横向比较组件库。
