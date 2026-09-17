---
id: acceptance-handover
title: 缺陷回归与验收记录交接
parent: orbit-map
labels: ["wayfinder:task", "ready-for-agent"]
status: open
assignee: null
order: 46
blocked_by: ["backend-integration", "browser-acceptance"]
---

## Question

如何把验收发现整理成可追溯的通过、失败与未验收记录，并明确交接剩余事项？

## Parent

[实现 Orbit Admin 首版前端脚手架](11-first-release-spec.md)。本票收尾验收，不修改或关闭父规格。

## What to build

验收中发现的缺陷先复现，适用时在既有测试边界补回归并修复后重跑；最终交出逐项标明结论与依据的验收记录，并说明仍未验证的环境与部署事项。

## Acceptance criteria

- [ ] 发现缺陷先复现；适用时在既有高层测试边界补回归测试，修复后重跑相关及完整检查；不新增范围外功能。
- [ ] 验收记录逐项标明通过、失败、未验收及依据，区分自动化、真实后端、人工浏览器与上线部署；环境缺失不得替换为模拟通过或静默跳过。
- [ ] 交接说明剩余事项与阻碍；有缺陷或必需验证未完成时，不将完整首版验收标为通过；实际发布、共享环境变更及破坏性清理须另获授权。

## Blocked by

- [真实后端功能联调](44-backend-integration.md)
- [浏览器人工验收与部署证据](45-browser-acceptance.md)

## Delivery notes

结论写入 `docs/planning/comments/` 的对应记录并按本地议题约定关闭本票；父规格与地图的关闭由用户决定，本票不代为处理。
