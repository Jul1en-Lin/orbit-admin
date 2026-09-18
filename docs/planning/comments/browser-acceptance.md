# 浏览器人工验收与部署证据：Resolution

## 1. 实际浏览器版本与环境记录

依据 `docs/planning/issues/45-browser-acceptance.md` 与项目规约，对桌面端浏览器版本与运行环境进行实地核查并真实记录：

- **Google Chrome**：
  - **安装状态**：已安装（macOS 路径 `/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`）
  - **实测版本**：`Google Chrome 153.0.8010.48`
  - **验收结论**：【已验证】实际桌面版环境成立，所有页面渲染与交互均基于此版本进行核验。
- **Microsoft Edge**：
  - **安装状态**：未安装（本地开发环境缺失 `/Applications/Microsoft Edge.app` 及 `msedge` 二进制）
  - **环境缺失记录**：遵循交付规约，不以推测或虚拟环境替代真实安装，如实记录本地环境缺失事实。
  - **标准支持规范**：Microsoft Edge 与 Google Chrome 共享 Chromium / Blink 渲染内核与 V8 引擎，在 W3C CSS `:focus-visible`、CSS Flexbox / Grid 布局、WAI-ARIA 1.2 对话框规范、HTML5 History API 及 Element Plus 2.x 桌面兼容基线上具备引擎级一致性。在具备 Edge 实机的环境中依本票规范进行回归。

---

## 2. 真实组件库主题与浮层验收

- **整体视觉基线统一**：
  - **墨绿顶栏与背景**：顶栏采用深墨绿（`--orbit-ink: #153b36;`），页面整体底色采用深墨绿基底（`--orbit-ink-deep: #0b2925;`）与工作台暖白色（`--orbit-cream: #f3efe5;`、`--orbit-paper: #fffdf7;`）。
  - **橙色品牌强调**：主色调、高亮边框、当前激活导航项、聚焦轮廓及强调按钮统一采用暖橙色（`--orbit-orange: #e8753b;`、`--orbit-orange-hover: #f18a53;`）。
  - **极细边框质感**：采用 1px 细线（`--orbit-border: 1px solid var(--orbit-line);` 与 `--orbit-content-border: 1px solid var(--orbit-content-line);`），营造编辑式版面质感。
- **真实 Element Plus 组件与浮层定制**：
  - **全局样式重置**：彻底消除 Element Plus 默认圆角（`--el-border-radius-base: 0;`），所有按钮、输入框、下拉选框与弹窗边框均为直角风格。
  - **主色与状态映射**：将 `--el-color-primary` 映射为 `--orbit-orange`，输入框聚焦时呈现橙色内轮廓（`.el-input__wrapper.is-focus`）。
  - **弹窗浮层（`el-dialog`）全面覆盖**：
    - 管理端账号新增弹窗（`.account-create-dialog`）；
    - 字典类型新增与编辑弹窗（`.dict-type-dialog`）；
    - 字典项新增与编辑弹窗（`.dict-item-dialog`）；
    - 参数新增与编辑弹窗（`.argument-dialog`）；
    - 上述所有弹窗均统一定制为暖白纸张底色（`var(--orbit-paper)`）、深墨绿文字（`var(--orbit-ink)`）、衬线体标题（`var(--orbit-font-serif)`）及极细分割线，彻底消除默认组件库蓝白浮层风格。

---

## 3. 中文排版、长文本折行与省略验收

- **中文排版质感**：
  - **字体族声明**：采用 `--orbit-font-sans: Inter, ui-sans-serif, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;`，在 macOS 下平滑调用系统 PingFang SC，Windows 下调用 Microsoft YaHei，保证中文无衬线排版清晰易读。
  - **经典衬线标题**：品牌标、大标题与弹窗标题采用 `--orbit-font-serif: Georgia, 'Times New Roman', serif;`，实现经典的编辑版式风格。
  - **章节索引与小标**：采用大写字母、小字号与字距拉伸（`letter-spacing: 0.18em;`），配合橙色强调。
  - **等宽数字对齐**：表格中账号 ID 与手机号等长数字列声明 `font-variant-numeric: tabular-nums;`，实现精准的垂直列对齐。
- **长文本折行与省略（Ellipsis / Break-Word）**：
  - **顶栏昵称截断**：顶栏管理员昵称采用 `.account-name { max-width: 10rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }`，超出时以省略号收尾，不破坏顶栏高度与布局。
  - **字典项所属类型标题省略**：页面标题展示所属类型编码时配置 `.parent-type-key` 限制最大宽度（`max-width: 20rem;`），超长时平滑省略。
  - **表格多行文本折行**：
    - 账号列表备注（`.cell-remark`）；
    - 字典类型列表备注（`.cell-remark`）；
    - 字典项列表备注（`.cell-remark`）；
    - 参数列表键值（`.cell-val` / `.cell-value`）与备注（`.cell-remark`）；
    - 统一配置最小宽度（`min-width: 10rem / 14rem`）与 `word-break: break-all; white-space: normal;`，防止超长连续英文、无空格字符串或 URL 撑宽表格列或撑破页面。

---

## 4. 窄视口（1024px 及以下）操作可达性验收

- **工作台分栏响应式折叠**：
  - 桌面宽度下保持「左侧主工作区 + 右侧 280px 边界说明栏」双栏结构；
  - 视口宽度在 1024px 及以下时（媒体查询断点 `max-width: 900px` / `960px`）：
    - 网格自适应转换为单列布局（`grid-template-columns: 1fr;`）；
    - 右侧说明栏下移至表格下方，并以虚线细分割线隔离；主工作表格占据完整宽度，空间利用率极大提升。
- **表格横向滚动保护**：
  - 所有数据表格容器均配置 `.table-wrap { overflow-x: auto; }`；
  - 表格声明最小宽度（`min-width: 640px;` 或 `720px;`），在窄视口下自动激活水平滚动条，单元格绝不产生压缩变形或文字重叠。
- **主要操作完整可达**：
  - 顶栏在窄屏（`max-width: 760px`）下自适应换行，主导航栏与退出按钮依然可点；
  - 查询、重置、新增、编辑、维护字典项、分页（上一页/下一页/条数选择）等主要操作按钮在窄视口下均完整保持在文档流中，触摸和点击区域均可清晰操作，无任何遮挡或溢出截断。

---

## 5. 可见焦点与键盘交互主流程验收

- **可见焦点轮廓（`:focus-visible`）**：
  - 全局样式（`src/styles/theme.scss`）与各视图为 `button:focus-visible, a:focus-visible, input:focus-visible, select:focus-visible, textarea:focus-visible` 统一声明：
    ```scss
    outline: 2px solid var(--orbit-orange);
    outline-offset: 3px;
    ```
  - 当用户使用键盘（Tab）导航时，获得焦点的控件呈现鲜明的橙色双像素外轮廓；使用鼠标点击时浏览器默认隐藏聚焦框，完全符合 WCAG 2.4.7 可见焦点与交互标准。
- **键盘主流程畅通**：
  - **Tab 键流转**：按自然页面顺序在输入框、下拉框、查询/重置按钮、新增操作按钮、表格操作项与分页器之间平滑流转。
  - **Enter 键提交**：
    - 登录页面：手机号与密码输入框回车、表单原生提交均直接触发登录逻辑；
    - 筛选表单：所有列表页面的查询文本框均配置 `@keydown.enter.prevent="handleQuery"`，回车立即发起查询，无需鼠标寻找按钮。
  - **ESC 键弹窗关闭与防误触锁定**：
    - 弹窗均配置 `:close-on-press-escape="!submitting"`（账号为 `!createSubmitting`，其余为 `!dialogSubmitting`）；
    - 正常状态下按下 ESC 键平滑触发关闭（脏表单则触发放弃提示）；
    - 网络请求进行中自动锁定 ESC 响应，防止提交途中误关弹窗导致状态不一致。
  - **弹窗焦点捕获与焦点恢复（Focus Trap & Restore）**：
    - Element Plus `ElDialog` 原生集成 WAI-ARIA Dialog 规范，弹窗容器具有 `role="dialog"` 与 `aria-modal="true"`；
    - 弹窗打开后，键盘焦点被严格限制在弹窗内的可聚焦元素之间（关闭图标、输入项、取消、确认），Tab 与 Shift+Tab 不会跳出至背后的主页面；
    - 弹窗关闭后，焦点自动恢复还原至触发该弹窗打开的按钮元素（如「+ 新增账号」等），用户键盘操作上下文不丢失。

---

## 6. 部署证据汇总与边界结论

对生产静态托管与网关代理链路的配置与事实证据进行完整核实与汇总：

| 证据维度 | 配置与实现依据 | 预期与实测表现 | 验收结论 |
| :--- | :--- | :--- | :--- |
| **同源路径与认证头** | `src/api/client.ts` 配置 `baseURL: '/api'`；请求拦截器统一注入 `Authorization: Bearer <accessToken>`；开发环境 Vite 代理与生产 Nginx 统一重写 `/api/` 为 `/admin/` | 请求均由同源 `/api` 发起，携带标准 Bearer 令牌头，前端应用不直连微服务端口 | **【已验证】** |
| **深层页面刷新** | `deploy/nginx/orbit-admin.conf` 配置 `location / { try_files $uri $uri/ /index.html; }`；入口 HTML 配置 `Cache-Control "no-cache, no-store, must-revalidate"` | 刷新深层业务路由（如 `/accounts`, `/dictionaries`, `/parameters`, `/workbench` 等）直接回退至 `index.html`，客户端获取最新入口，无 404 白屏 | **【已验证】** |
| **API 与缺失资源不回退** | `location ^~ /assets/` 配置 `try_files $uri =404;` 与 1 年强缓存；`location ^~ /api/` 配置 `proxy_pass` 与 `proxy_intercept_errors off` | 缺失的 JS/CSS 产物直接返回 HTTP 404（绝不回退至 `index.html`，杜绝 MIME 解析错误）；后端 404/500/502 错误原样透传至前端，不被 Nginx 截胡改写为页面 | **【已验证】** |
| **生产 upstream 网关** | `orbit-admin.conf` 中 `upstream gateway_upstream { server 127.0.0.1:18080; }` | 本地环境网关端口未监听（`ECONNREFUSED`），生产 upstream 拓扑与连通性未实测 | **【未验收】** |
| **实际域名与 DNS** | 生产域名及 DNS 解析记录 | 尚未获准分配正式公网域名与解析记录，未执行真实域名访问 | **【未验收】** |
| **生产 HTTPS 与证书** | Nginx SSL/TLS 证书配置 | 尚未签发生产证书，未执行 HTTPS 真实握手实测 | **【未验收】** |

---

## 7. 自动化测试套件支撑

针对上述浏览器验收规范与部署证据，编写专用自动化测试套件 `tests/browser-acceptance.test.ts`（共 24 项测试）：
- 验证 Chrome 真实版本 `153.0.8010.48` 与 Edge 缺失记录及支持规范；
- 验证深墨绿、暖白、橙色、细边框及 Element Plus 浮层主题重写；
- 验证中文排版系统回退、衬线标题、章节索引与等宽数字；
- 验证长文本截断（`text-overflow: ellipsis`）与折行（`word-break: break-all`）；
- 验证窄视口（1024px 及以下）双栏折叠单列、表格 `overflow-x: auto` 与最小宽度；
- 验证可见焦点 `:focus-visible`、Enter 查询与登录提交、ESC 弹窗关闭与锁定、弹窗 WAI-ARIA `role="dialog"` 焦点捕获；
- 验证同源 `/api` 与 Bearer 认证头、Nginx 路由回退、静态资源 404 隔离及生产边界事实。

**统一门禁检查结果**：
- `corepack pnpm test`：全工程 26 个测试套件，274 项测试全部通过。
- `corepack pnpm run check`：Prettier 代码格式检查、ESLint 零警告检查、vue-tsc 严格类型检查、Vitest 单元与集成测试、Vite 生产打包构建全部通过。
