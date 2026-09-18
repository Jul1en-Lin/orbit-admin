---
id: status-dictionary
title: 身份与状态字典读取
parent: orbit-map
labels: ["wayfinder:task", "ready-for-agent"]
status: closed
assignee: Jul1en-Lin
order: 27
blocked_by: ["account-list-query"]
---

## Question

如何完整读取管理端身份与状态的字典选项，使工作人员正确理解账号身份与状态，且不因未知编码丢失记录？

## Parent

[实现 Orbit Admin 首版前端脚手架](11-first-release-spec.md)。本票落实管理端账号所用字典的读取与展示。

## What to build

身份与状态从后端字典完整读取并映射为可读文本；字典加载失败时明确反馈且可重试；未知编码显示原始值，记录不消失。

## Acceptance criteria

- [x] 完整读取管理端身份与通用状态两个 typeKey 的字典项所有分页，以 dataKey 对应展示值；不硬编码候选，不调用内部接口。
- [x] 字典加载失败明确反馈且可重试；不虚构编码，选项缺失时不以默认值代替。
- [x] 未知编码展示原始值且不丢弃记录；管理端账号的字符串状态与字典记录的数值状态不混用。

## Blocked by

- [管理端账号列表查询与筛选](25-account-list-query.md)

## Delivery notes

本票交付读取与展示路径；新增表单对选项的依赖由[新增管理端账号与成功路径](28-account-create-dialog.md)使用。分页响应字段的既有约定以先落地的列表票为准，不另立一套映射。
