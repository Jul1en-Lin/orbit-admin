---
id: dictionary-type-maintenance
title: 查询和维护字典类型
parent: orbit-map
labels: ["wayfinder:task", "ready-for-agent"]
status: closed
assignee: null
order: 16
blocked_by: ["login-workbench"]
---

## Question

如何让后台工作人员从字典导航查询、分页浏览、新增和编辑字典类型？

## Parent

[实现 Orbit Admin 首版前端脚手架](11-first-release-spec.md)。本票落实字典类型，不包含字典项维护。

## What to build

字典导航进入类型列表，工作人员可以筛选、分页并通过弹窗维护编码、名称和备注，明确知道状态不可修改。

## Acceptance criteria

- [ ] `GET /dictionary_type/list` 使用 pageNo、pageSize、可选 typeKey 和 value；编码精确、名称前缀筛选。展示编码、名称、状态、备注及可用操作。
- [ ] 分页响应按 totals、totalPages、list 处理；页码和页大小由页面管理。默认每页 10 条，可选 20、50；查询及改变页大小回第一页，重置清空筛选重新查询。
- [ ] 点击查询或回车才应用筛选；重新进入页面恢复默认状态。加载、空、失败可区分，失败可重试，连续查询只接受最新响应，失败时不将旧结果当作新结果。
- [ ] 新增 `POST /dictionary_type/add`，编辑 `POST /dictionary_type/edit`；提交 typeKey、value、可选 remark，编辑按 typeKey 定位且编码只读。编码、名称拒绝全空白，不添加契约外字符集或长度约束。
- [ ] 不提供删除或状态写入。字典项维护尚未交付时不提供失效的入口，不用伪造数据冒充可用功能。
- [ ] 新增、编辑使用弹窗；提交中防重复且禁止关闭；明确失败保留输入，仅反馈一次。新增成功回第一页，编辑成功保留当前页，关闭弹窗并刷新，不保证新增记录出现在第一页。
- [ ] 写入成功与刷新失败分开反馈；写入结果不确定保留输入、解除锁定并提示先查询核实，不自动重试。
- [ ] 脏表单取消、关闭及站内导航需确认；未修改直接关闭，认证失效直接清理；不持久化表单或拦截浏览器关闭。
- [ ] 长文本可完整查看，窄视口主要操作可达；人工验证主题、键盘查询与表单操作、弹窗焦点循环及恢复。
- [ ] 从真实页面入口与 HTTP 边界测试列表和写入契约、分页、重置、竞态、错误状态、只读编码、校验、页码刷新规则、脏表单及提交不确定性，不测试组件库内部实现。

## Blocked by

- [登录并进入工作台](12-login-workbench.md)

## Delivery notes

本票可与管理端账号和参数并行，不依赖其他业务票提取通用组件。复用前置工程测试初始化；已落地的相似列表／表单测试可作为先例，但不因此增加阻塞边。不建立万能表格或配置式表单。真实写入需获准环境和数据，结果如实记录。

本票未实现，已拆分为更细的票：[32 字典类型列表与筛选](32-dict-type-list.md)、[33 字典类型分页交互](33-dict-type-paging.md)、[34 字典类型新增与编辑](34-dict-type-edit.md)。拆分依据见[拆分记录](../comments/dictionary-type-maintenance.md#resolution)。
