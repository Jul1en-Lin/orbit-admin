---
id: dict-item-query
title: 字典项查询与往返
parent: orbit-map
labels: ["wayfinder:task", "ready-for-agent"]
status: open
assignee: null
order: 35
blocked_by: ["dict-type-list"]
---

## Question

如何让工作人员从所属字典类型进入字典项页维护选项，并在返回时回到可预期的类型列表状态？

## Parent

[实现 Orbit Admin 首版前端脚手架](11-first-release-spec.md)。本票落实字典项列表、所属类型与往返导航。

## What to build

工作人员从字典类型列表进入某个类型的字典项页，看到所属类型并按名称前缀筛选，查看编码、名称、排序、状态与备注，返回类型列表时恢复默认筛选与第一页。

## Acceptance criteria

- [ ] 字典类型列表提供有效的字典项入口；字典项页显示所属类型。
- [ ] 查询使用固定所属类型、可选名称与 pageNo、pageSize；名称按前缀筛选，保持后端给出的排序。
- [ ] 展示编码、名称、排序、状态、备注及可用操作；分页与状态语义沿用既有先例。
- [ ] 返回字典类型列表时恢复默认筛选与第一页。

## Blocked by

- [字典类型列表与筛选](32-dict-type-list.md)

## Delivery notes

入口位于字典类型列表的操作区，[字典类型新增与编辑](34-dict-type-edit.md)也改动同一区域，两者并行时需协调该页面的改动顺序。新增与编辑字典项由后续票交付，本票不提供删除或状态写入。
