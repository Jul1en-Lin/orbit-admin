---
id: login-workbench
title: 登录并进入工作台
parent: orbit-map
labels: ["wayfinder:task", "ready-for-agent"]
status: closed
assignee: codex
order: 12
blocked_by: []
---

## Question

如何让后台工作人员通过现有登录契约进入可运行的首版工作台，并为后续功能建立可验证的工程起点？

## Parent

[实现 Orbit Admin 首版前端脚手架](11-first-release-spec.md)。本票落实登录、基础工作台及工程起点；完整契约以父规格为准。

## What to build

后台工作人员输入手机号和密码，登录成功并取得当前管理端账号信息后进入工作台；可以查看昵称并本地退出。默认管理端账号入口暂不展示业务列表，也不展示虚构数据。首个切片同时交付可运行工程、统一主题、HTTP 接入与自动检查。

## Acceptance criteria

- [ ] 使用 Vue 3、Vite、TypeScript、Vue Router、Pinia、Axios、SCSS、Element Plus；核实兼容性，固定 Node 24 的具体补丁版本和 pnpm 版本，提交依赖锁文件。
- [ ] 一个本地命令执行格式、零警告 Lint、严格类型检查、测试和生产构建；冻结锁文件安装可复现。提供开发启动与检查说明。
- [ ] 按业务聚合模块，认证、布局和通用能力独立；请求层处理认证头和响应解包，业务层提供契约类型，不建立万能表格或配置式表单。
- [ ] 浏览器经同源 `/api` 访问，本地代理替换为网关 `/admin`；网关目标可配置，不绕过网关。成功包裹按 code=200000 解包；HTTP 状态和业务 code 用于失败分类，不依赖消息文本。
- [ ] 登录调用 `POST /sys_user/login/password`，提交 phone、password；仅校验非空，不去除密码空格。回车可提交，提交中防重复；失败仅反馈一次并保留输入。
- [ ] 密码按 UTF-8、AES-128/ECB、兼容 PKCS5Padding 的填充和 Hex 输出转换；以非真实密码的 Java 可信向量验证公共输入输出，不记录真实凭据或密钥，不宣称浏览器加密替代 HTTPS。
- [ ] 保存 accessToken 到 sessionStorage，使用 Bearer 认证头；登录后取得 `GET /sys_user/login/get_info` 的当前管理端账号信息才进入工作台。初始化期间显示加载；失败可恢复，不进入身份未知的业务页面。
- [ ] 未登录不能进入工作台；本地退出清除会话和页面数据，不调用 C 端退出接口。密码不持久化、不记日志，离开登录页清除。
- [ ] 使用已选 B 顶栏分栏布局及深墨绿、暖白、橙色主题；展示品牌、当前导航、昵称和退出。默认管理端账号入口不冒充已实现列表；未交付导航不链接到伪造页面。
- [ ] 主题集中映射 Element Plus，正文使用清晰无衬线字体，窄视口主要操作可达。真实浏览器首批检查真实组件、浮层和可见焦点，记录实际结果；不将原型直接作为正式应用。
- [ ] 自动测试从应用入口挂载真实路由、状态、组件及请求层，只在 HTTP 边界模拟；验证登录请求、加载、成功导航、失败反馈、防重复和退出。独立测试密码转换，不断言私有实现。

## Blocked by

无，可立即开始。

## Delivery notes

仓库当前只有规划和可丢弃原型，无正式测试先例；沿用父规格确定的 Vitest、Vue Test Utils、jsdom，测试集中在根目录 tests/。后续会话恢复与竞态由下一票扩展，不在此票构造所有业务页面。人工或真实接口验证未执行时明确记为未验收。

实现结果与未验收项见[Resolution](../comments/login-workbench.md#resolution)。
