---
id: first-release-acceptance
title: 完成首版联调与浏览器验收
parent: orbit-map
labels: ["wayfinder:task", "ready-for-agent"]
status: closed
assignee: null
order: 20
blocked_by: ["session-recovery", "management-account-create", "dictionary-item-maintenance", "parameter-maintenance", "independent-deployment"]
---

## Question

如何以自动检查、真实后端联调及浏览器人工验收证明首版可用，并准确交接尚未验证的环境与部署事项？

## Parent

[实现 Orbit Admin 首版前端脚手架](11-first-release-spec.md)。本票对已完成纵向切片做跨功能验收，不替代各票自己的测试，也不修改或关闭父规格。

## What to build

维护者获得整合后的首版及可追溯验收记录，能够区分已验证功能、已知缺陷、环境阻碍和未执行部署。后台工作人员的登录、查询、维护与退出完整流程在真实环境中接受验证。

## Acceptance criteria

- [ ] 冻结锁文件安装并运行完整统一检查，记录格式、Lint、类型、自动测试及生产构建的结果；不以单次构建成功宣称首版交付。
- [ ] 核实本地后端及其依赖的当前运行状态；缺少环境或凭据时列明阻碍，通过非仓库渠道获取，不在记录或输出中披露秘密。
- [ ] 在获准环境使用获准测试数据验证登录、刷新恢复、失效及退出，包括 get_info 的实际鉴权行为；不改后端、不擅自清理共享数据。
- [ ] 真实联调管理端账号查询和新增、完整身份／状态字典；联调字典类型、字典项、参数的查询、新增和编辑，并核实参数可选筛选行为与接口限制。
- [ ] 整体导航、默认页、404、重新进入页面的默认状态、会话失效时的表单清理及不重放写请求符合父规格；不同模块交互一致，不残留占位导航或虚构统计。
- [ ] 在桌面 Chrome、Edge 当前稳定版记录实际版本，验收真实 Element Plus 主题和浮层、中文排版、长文本、窄视口操作可达性、可见焦点、键盘主流程、弹窗焦点循环及关闭后恢复。
- [ ] 汇总部署票的证据：同源路径和认证头、页面刷新、API 与缺失资源不回退 HTML；生产 upstream、域名及 HTTPS 未实测时保持未验收，不擅自发布。
- [ ] 验收记录逐项标明通过、失败、未验收及依据，区分自动化、真实后端、人工浏览器与上线部署。环境缺失不得替换为模拟通过或静默跳过。
- [ ] 发现缺陷先复现；适用时在既有高层测试边界补回归测试，修复后重跑相关及完整检查。不新增范围外功能或浏览器端到端自动化体系。
- [ ] 交接说明剩余事项和阻碍；有缺陷或必需验证未完成时，不将完整首版验收标为通过。实际发布、共享环境变更及破坏性清理须另获授权。

## Blocked by

- [恢复会话与处理认证失效](13-session-recovery.md)
- [新增管理端账号](15-management-account-create.md)
- [查询和维护字典项](17-dictionary-item-maintenance.md)
- [查询和维护参数](18-parameter-maintenance.md)
- [验证独立部署链路](19-independent-deployment.md)

## Delivery notes

沿用各切片建立的真实组件、路由、状态和请求层测试，仅在 HTTP 边界模拟；不重复测试每层实现，不以大面积快照或覆盖率百分比作为门槛。人工检查以父规格及其引用的页面验收、工程、组件和部署决策为依据。若只有阻碍记录而缺少必要真实验证，本票保持未完成，除非用户明确调整验收范围。

本票未实现，已拆分为更细的票：[43 完整自动检查与后端可用性核实](43-automated-check.md)、[44 真实后端功能联调](44-backend-integration.md)、[45 浏览器人工验收与部署证据](45-browser-acceptance.md)、[46 缺陷回归与验收记录交接](46-acceptance-handover.md)。拆分依据见[拆分记录](../comments/first-release-acceptance.md#resolution)。
