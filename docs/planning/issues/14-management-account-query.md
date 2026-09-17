---
id: management-account-query
title: 查询管理端账号
parent: orbit-map
labels: ["wayfinder:task", "ready-for-agent"]
status: closed
assignee: null
order: 14
blocked_by: ["login-workbench"]
---

## Question

如何让后台工作人员查询管理端账号，并以完整字典正确理解身份与状态？

## Parent

[实现 Orbit Admin 首版前端脚手架](11-first-release-spec.md)。本票落实默认业务页及管理端账号只读查询。

## What to build

登录后的默认页展示管理端账号列表，支持精确筛选、重置和失败重试。身份、状态从后端字典读取；完整记录不会因未知编码而消失。

## Acceptance criteria

- [ ] 调用 `POST /sys_user/list`，JSON 可选字段为 userId、phoneNumber、status，全部精确匹配；返回数组，不添加分页或排序。
- [ ] 展示 ID、手机号、昵称、身份、状态、备注；长文本可完整查看，不引入编辑、删除、重置密码或停用入口。
- [ ] 点击查询或回车应用筛选；重置清空并查询。重新进入页面恢复默认状态，不在 Pinia 中缓存筛选和列表。
- [ ] 区分加载、暂无数据和失败；失败在当前页面提供重试。重新查询失败不得将旧结果伪装为新结果；连续查询仅接受最新响应。
- [ ] 通过字典项列表完整读取 typeKey=admin 和 common_status 的所有分页，以 dataKey 对应 value，不硬编码候选、不调用内部 Feign 接口。
- [ ] 字典选项加载失败明确反馈且可重试，不虚构编码；未知编码展示原始值，不丢弃记录。管理端账号字符串 status 与字典记录数值 status 不混用。
- [ ] 使用工作台主题和说明栏说明现有操作边界；表格窄视口可横向滚动，键盘可完成筛选，焦点可见。
- [ ] 从真实页面入口和 HTTP 边界测试请求字段、非分页响应、完整分页字典、未知编码、加载／空／失败、重置、最新响应生效及旧结果处理。

## Blocked by

- [登录并进入工作台](12-login-workbench.md)

## Delivery notes

复用前置工单的页面测试初始化与请求层；若其尚无列表先例，本票建立外部行为测试先例，不增加通用表格封装。新增管理端账号由后续工单交付。真实接口和键盘人工验证分别记录结果。

本票未实现，已拆分为更细的票：[25 管理端账号列表查询与筛选](25-account-list-query.md)、[26 列表状态与最新响应](26-account-list-states.md)、[27 身份与状态字典读取](27-status-dictionary.md)。拆分依据见[拆分记录](../comments/management-account-query.md#resolution)。
