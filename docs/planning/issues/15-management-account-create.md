---
id: management-account-create
title: 新增管理端账号
parent: orbit-map
labels: ["wayfinder:task", "ready-for-agent"]
status: closed
assignee: null
order: 15
blocked_by: ["management-account-query"]
---

## Question

如何从列表新增管理端账号，并明确区分提交失败、成功和结果不确定？

## Parent

[实现 Orbit Admin 首版前端脚手架](11-first-release-spec.md)。本票落实管理端账号新增，不启用编辑分支。

## What to build

后台工作人员在列表中打开新增弹窗，主动选择身份和状态、填写资料后提交，成功后返回更新的列表。失败保留输入；未确认写入结果时提示先查询核实。

## Acceptance criteria

- [ ] 调用 `POST /sys_user/add_edit`，不传 userId；identity、phoneNumber、password、nickName、status 必填，remark 可选。仅新增，不提供管理端账号编辑能力。
- [ ] 密码为 1–20 位英文字母或数字；不擅自复用登录的 AES 转换，不新增契约外的格式或长度约束，不记录密码。
- [ ] 复用完整后端字典选项，以 dataKey 提交；身份和状态须主动选择。选项加载失败可重试，阻止依赖选项的提交。
- [ ] 提交前展示字段校验；提交中防重复且禁止关闭弹窗，明确失败保留输入且只反馈一次。
- [ ] 明确成功后关闭并刷新列表；写入成功但刷新失败时分别说明，不诱导再次保存。非分页列表不增加分页动作。
- [ ] 超时等未收到明确结果时保留输入、解除提交锁定，提示“提交结果未确认，请先查询核实”，不自动重试，不宣称绝对防重复写入。
- [ ] 修改过的表单取消、关闭或站内导航需确认放弃；未修改直接关闭。认证失效可直接清理，不增加浏览器关闭拦截或表单持久化。
- [ ] 真实 Element Plus 弹窗及下拉遵循统一主题；人工验证键盘填写、焦点循环和关闭后恢复至触发入口。
- [ ] 在列表到新增的完整页面流程测试字段和请求契约、选项失败、校验、成功刷新、失败保留、防重复、关闭限制、脏表单确认及不确定结果；只模拟 HTTP，不 mock 表单内部逻辑。

## Blocked by

- [查询管理端账号](14-management-account-query.md)

## Delivery notes

复用前置列表与字典读取行为，自动测试沿用应用／页面入口和 HTTP 边界。与其他业务表单保持父规格约定一致，但不为共享潜力建立万能表单。人工写入只使用获准环境及测试数据；未执行时记为未验收。

本票未实现，已拆分为更细的票：[28 新增管理端账号与成功路径](28-account-create-dialog.md)、[29 校验、防重复与失败反馈](29-account-create-validation.md)、[30 写入结果不确定与刷新失败](30-account-create-uncertain.md)、[31 脏表单确认与失效清理](31-account-create-dirty.md)。拆分依据见[拆分记录](../comments/management-account-create.md#resolution)。
