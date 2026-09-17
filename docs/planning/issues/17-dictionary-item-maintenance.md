---
id: dictionary-item-maintenance
title: 查询和维护字典项
parent: orbit-map
labels: ["wayfinder:task", "ready-for-agent"]
status: closed
assignee: null
order: 17
blocked_by: ["dictionary-type-maintenance"]
---

## Question

如何从所属字典类型维护字典项，并遵守编码、所属类型和备注的既有接口限制？

## Parent

[实现 Orbit Admin 首版前端脚手架](11-first-release-spec.md)。本票落实字典类型到字典项的完整维护流程。

## What to build

后台工作人员从字典类型进入字典项页，查看所属类型、筛选和维护字典项，再返回类型列表。界面明确阻止接口不支持的修改。

## Acceptance criteria

- [ ] 字典类型列表提供有效字典项入口；字典项页显示所属类型，返回类型页时恢复默认筛选和第一页。
- [ ] `GET /dictionary_data/list` 使用固定 typeKey、可选 value、pageNo、pageSize；名称按前缀筛选，保持后端 sort、id 升序，不增加排序能力。
- [ ] 展示编码、名称、排序、状态、备注及操作；长文本可完整查看。默认每页 10 条，可选 20、50；查询、重置、页大小和重新进入页面的规则与父规格一致。
- [ ] 区分加载、暂无数据和失败，支持重试；连续查询只接受最新响应，失败不将旧数据当作新结果。
- [ ] 新增 `POST /dictionary_data/add` 提交 typeKey、dataKey、value、可选 sort、remark；编码和名称拒绝全空白，sort 有值须为整数但不限定正数，不附加契约外字符集或长度限制。
- [ ] 编辑 `POST /dictionary_data/edit` 提交 dataKey、value、可选 sort、remark；编码只读，所属类型固定，不发送可变所属类型，不提供删除或状态写入。
- [ ] 清空已有备注时阻止提交并提示“当前接口不支持清空备注”，不以空格绕过；不承诺把已有排序清空为 null，不将无效清空呈现为已生效。
- [ ] 弹窗提交中防重复且禁止关闭，明确失败保留输入并只反馈一次；成功后新增回第一页、编辑留当前页并刷新。写成功但刷新失败单独说明；结果不确定保留输入、解除锁定并提示先查询核实，不自动重试。
- [ ] 脏表单取消、关闭及站内导航需确认，未修改直接关闭，认证失效直接清理；不引入表单持久化或浏览器关闭拦截。
- [ ] 真实浏览器验证统一主题、窄视口、键盘操作、弹窗焦点循环及关闭后的焦点恢复。
- [ ] 复用字典类型的高层测试先例，在真实路由／页面和 HTTP 边界验证所属类型、往返导航、分页查询、请求字段、备注限制、整数排序、只读编码及完整写入异常行为。

## Blocked by

- [查询和维护字典类型](16-dictionary-type-maintenance.md)

## Delivery notes

仅在真实复用出现时提取共享能力，不跨业务引用页面内部实现。自动测试断言对外请求和可观察行为，不断言内部组件状态。真实写入需获准环境及测试数据，未执行的联调和人工检查明确记为未验收。

本票未实现，已拆分为更细的票：[35 字典项查询与往返](35-dict-item-query.md)、[36 字典项新增](36-dict-item-create.md)、[37 字典项编辑与备注限制](37-dict-item-edit.md)。拆分依据见[拆分记录](../comments/dictionary-item-maintenance.md#resolution)。
