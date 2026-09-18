---
id: dict-type-paging
title: 字典类型分页交互
parent: orbit-map
labels: ["wayfinder:task", "ready-for-agent"]
status: closed
assignee: Jul1en-Lin
order: 33
blocked_by: ["dict-type-list"]
---

## Question

如何让工作人员在字典类型列表上分页浏览，并保证页码与每页条数始终有效？

## Parent

[实现 Orbit Admin 首版前端脚手架](11-first-release-spec.md)。本票确立分页列表的页码与页大小规则。

## What to build

字典类型列表支持分页浏览，默认每页 10 条并可切换为 20 或 50 条；查询或改变每页条数后回到第一页；重新进入页面恢复默认筛选与第一页。

## Acceptance criteria

- [x] 按 totals、totalPages、list 处理分页响应；页码与页大小由页面管理，默认每页 10 条，可选 20、50。
- [x] 查询或改变页大小后回到第一页。
- [x] 重新进入页面恢复默认筛选与第一页。
- [x] 不凭空增加后端未提供的排序能力或分页字段。

## Blocked by

- [字典类型列表与筛选](32-dict-type-list.md)

## Delivery notes

后端分页响应不含当前页码与页大小，全部由前端管理。本票确立的分页规则是[参数列表与筛选](38-argument-list.md)的先例。
