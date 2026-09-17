---
id: argument-list
title: 参数列表与筛选
parent: orbit-map
labels: ["wayfinder:task", "ready-for-agent"]
status: open
assignee: null
order: 38
blocked_by: ["page-test-harness"]
---

## Question

如何让后台工作人员从参数导航查询配置项，并按编码与名称定位目标参数？

## Parent

[实现 Orbit Admin 首版前端脚手架](11-first-release-spec.md)。本票落实参数列表，不包含写入。

## What to build

参数导航进入列表，工作人员按编码精确、名称包含筛选，分页浏览并看到编码、名称、值与备注，长文本可完整查看。

## Acceptance criteria

- [ ] 参数导航进入列表，调用参数列表接口，使用 pageNo、pageSize 与可选 configKey 和 name；编码精确、名称包含筛选。
- [ ] 展示编码、名称、值、备注及可用操作；长文本可完整查看。
- [ ] 分页、重置、重新进入默认状态以及加载、空、失败与最新响应语义沿用既有先例。
- [ ] 不提供删除。

## Blocked by

- [抽取页面级测试初始化](21-page-test-harness.md)

## Delivery notes

顶栏参数入口当前为不可用占位，本票交付后启用。列表接口可选筛选的后端校验行为须真实联调核实，本票不以模拟响应断言其可用，该核实由[真实后端功能联调](44-backend-integration.md)承担。
