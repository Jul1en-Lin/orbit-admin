---
id: dict-type-list
title: 字典类型列表与筛选
parent: orbit-map
labels: ["wayfinder:task", "ready-for-agent"]
status: open
assignee: null
order: 32
blocked_by: ["page-test-harness"]
---

## Question

如何让后台工作人员从字典导航查询字典类型，并按编码与名称定位需要维护的类型？

## Parent

[实现 Orbit Admin 首版前端脚手架](11-first-release-spec.md)。本票落实字典类型列表，不包含字典项维护。

## What to build

字典导航进入字典类型列表，工作人员按编码精确、名称前缀筛选，看到编码、名称、状态与备注，并可按既定规则重置。

## Acceptance criteria

- [ ] 字典导航进入类型列表，调用字典类型列表接口，使用 pageNo、pageSize 与可选 typeKey 和 value；编码精确、名称前缀筛选。
- [ ] 展示编码、名称、状态、备注及可用操作；长文本可完整查看。
- [ ] 点击查询或回车才应用筛选；重置清空筛选并重新查询；重新进入页面恢复默认状态。
- [ ] 加载、暂无数据、失败与重试、只接受最新响应的语义沿用既有列表先例。

## Blocked by

- [抽取页面级测试初始化](21-page-test-harness.md)

## Delivery notes

顶栏字典入口当前为不可用占位，本票交付后启用；字典项维护入口与新增、编辑动作由后续票提供，本票不提供删除或状态写入。分页交互由[字典类型分页交互](33-dict-type-paging.md)交付。
