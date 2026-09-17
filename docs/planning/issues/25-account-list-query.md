---
id: account-list-query
title: 管理端账号列表查询与筛选
parent: orbit-map
labels: ["wayfinder:task", "ready-for-agent"]
status: closed
assignee: codex
order: 25
blocked_by: ["page-test-harness"]
---

## Question

如何让后台工作人员在默认业务页查询管理端账号，并按 ID、手机号与状态精确定位记录？

## Parent

[实现 Orbit Admin 首版前端脚手架](11-first-release-spec.md)。本票落实默认业务页与管理端账号只读查询，不交付新增。

## What to build

登录后的默认页展示管理端账号列表，工作人员按 ID、手机号、状态精确筛选，可重置回默认结果，并可完整查看长文本字段。

## Acceptance criteria

- [x] 默认业务页调用管理端账号列表接口，JSON 可选字段为 ID、手机号、状态，全部精确匹配；返回数组，不添加分页或排序。
- [x] 展示 ID、手机号、昵称、身份、状态、备注；长文本可完整查看；不提供编辑、删除、重置密码或停用入口。
- [x] 点击查询或回车才应用筛选；重置清空筛选并重新查询；重新进入页面恢复默认状态，不在全局状态中缓存筛选与列表。

## Blocked by

- [抽取页面级测试初始化](21-page-test-harness.md)

## Delivery notes

顶栏导航中管理端账号入口当前为不可用占位，本票交付后启用并指向该页；未交付的字典与参数入口保持不可用，不链接到伪造页面。身份与状态列先按原始编码显示，完整字典读取由[身份与状态字典读取](27-status-dictionary.md)交付。状态与错误反馈语义由[列表状态与最新响应](26-account-list-states.md)补齐。
