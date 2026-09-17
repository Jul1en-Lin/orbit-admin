---
id: account-list-states
title: 列表状态与最新响应
parent: orbit-map
labels: ["wayfinder:task", "ready-for-agent"]
status: closed
assignee: codex
order: 26
blocked_by: ["account-list-query"]
---

## Question

如何让工作人员分清加载、空结果与失败，并避免旧响应覆盖新条件下的结果？

## Parent

[实现 Orbit Admin 首版前端脚手架](11-first-release-spec.md)。本票确立列表页的状态与竞态语义。

## What to build

管理端账号列表区分加载、暂无数据与失败，失败留在当前页可重试；连续查询只呈现最新一次的结果，失败时不把旧数据当作新结果；窄视口和键盘下主要操作仍可达。

## Acceptance criteria

- [x] 区分加载、暂无数据与失败；失败留在当前页面并提供重试入口。
- [x] 重新查询失败不得把旧结果当作新结果展示；连续查询只接受最新一次响应。
- [x] 表格窄视口可横向滚动，仅用键盘可完成筛选，焦点可见；说明栏写明当前操作边界。

## Blocked by

- [管理端账号列表查询与筛选](25-account-list-query.md)

## Delivery notes

本票确立的状态与竞态语义是后续列表票（[字典类型列表与筛选](32-dict-type-list.md)、[参数列表与筛选](38-argument-list.md)）的先例，后续票沿用同一套而不各自另立。断言界面、导航与请求次数，不断言内部状态结构。
