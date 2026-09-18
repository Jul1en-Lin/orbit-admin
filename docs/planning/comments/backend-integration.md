# 真实后端功能联调：Resolution

## 联调环境核查结果与客观事实

根据 `docs/planning/issues/44-backend-integration.md`、`docs/planning/assets/backend-contract.md` 及交付规约，对本地真实联调环境及依赖微服务进行实时探测，客观事实记录如下：

### 1. 网络端口与进程连通性探测
核查时间：2026-09-18 19:51:30 +0800。

- **本地 API 网关（`127.0.0.1:18080`）**：
  - 检测结果：`Connection refused`（`ECONNREFUSED`），端口无进程监听。网关服务未启动。
- **管理后台微服务（`127.0.0.1:18081` / `lien-admin`）**：
  - 检测结果：`Connection refused`（`ECONNREFUSED`），服务未启动。
- **Nacos 注册与配置中心（`127.0.0.1:8848`）**：
  - 检测结果：`Connection refused`（`ECONNREFUSED`），Nacos 未运行。
- **Redis 缓存服务（`127.0.0.1:6379`）**：
  - 检测结果：`Connection refused`（`ECONNREFUSED`），Redis 未运行。
- **MySQL 数据库（`127.0.0.1:3306`）**：
  - 存在独立 mysqld 进程，但前端无权且未获准直接连接数据库，前端应用亦不直连数据库。
- **微服务运行凭据**：
  - 未获得已获准的真实联调账号（手机号与密码），未提供获准写入的测试数据集。

### 2. 交付准则执行（Delivery Notes）
遵循交付规约：**「环境缺失时如实逐项记录为【未验收】与具体阻碍，绝不以模拟通过替代真实联调，绝不擅自修改后端或缩减规格」**。

---

## 首版功能真实联调清单与逐项验收状态

### 1. 登录、会话恢复、认证失效与退出
- **接口契约**：
  - 登录：`POST /sys_user/login/password`（请求体携带 `phone` 与 AES-ECB 加密后的 `password`；返回 `Result<{accessToken: string, expires: number}>`）
  - 获取当前账号：`GET /sys_user/login/get_info`（请求头携带 `Authorization: Bearer <accessToken>`；返回 `Result<SysUserLoginVO>`）
  - 认证失效：令牌过期或无效时后端返回 `401004` / HTTP 401
- **前端实现**：
  - 登录密码前端 AES 加密传输；
  - 会话在 `sessionStorage` 暂存令牌，刷新受保护页面时通过 `GET /sys_user/login/get_info` 自动恢复工作台状态；
  - 统一捕获 401 错误，立即清理令牌与当前账号，跳转至登录页并携带安全 `redirect` 参数；退出登录立即注销会话。
- **验收状态**：**【未验收】**
- **具体阻碍**：
  - 本地网关（18080）与后台微服务（18081）未启动，无法建立真实 HTTP 通信；
  - 缺乏已获准的联调测试账号凭据。

### 2. 管理端账号查询、新增与字典映射
- **接口契约**：
  - 列表查询：`POST /sys_user/list`（可选精确匹配 `userId`, `phoneNumber`, `status`；返回 `Result<SysUserVO[]>`，不分页）
  - 账号新增：`POST /sys_user/add_edit`（首版仅新增：请求体**严禁携带 `userId`**，传 `identity`, `phoneNumber`, `password`, `nickName`, `status`；返回 `Result<Long>`）
  - 身份字典：`GET /dictionary_data/list?typeKey=admin`（分页读取）
  - 状态字典：`GET /dictionary_data/list?typeKey=common_status`（分页读取）
- **前端实现**：
  - 页面挂载时分页拉取 `admin` 与 `common_status` 完整字典数据，将列表与下拉框动态映射为可读标签，未知编码兜底展示原始值；
  - 账号新增弹窗校验非空与密码正则（`^[a-zA-Z0-9]+$`，长度不超过 20 位），提交体严格排除 `userId`；
  - 校验失败、手机号占用（后端 `400000` / HTTP 400）时保留用户输入并给出清晰反馈；新增成功后自动刷新列表。
- **验收状态**：**【未验收】**
- **具体阻碍**：
  - 后台微服务未运行，无法验证实际鉴权与数据库增查行为；
  - 未提供获准写入的测试数据，不擅自修改共享数据库。

### 3. 字典类型、字典项维护
- **接口契约**：
  - 字典类型：`GET /dictionary_type/list`（分页，`totals`, `totalPages`, `list`；`value%` 前缀模糊，`typeKey` 精确）；`POST /dictionary_type/add`；`POST /dictionary_type/edit`（按 `typeKey` 更新，编码只读）
  - 字典项：`GET /dictionary_data/list`（按 `typeKey` 分页，`sort ASC, id ASC` 排序）；`POST /dictionary_data/add`；`POST /dictionary_data/edit`（按 `dataKey` 更新，`dataKey` 与所属 `typeKey` 只读）
- **前端实现**：
  - 支持类型与项的分页浏览、向右前缀筛选、切页重置回首页；
  - 编辑弹窗编码字段只读；
  - 针对后端 `POST /dictionary_data/edit` 不允许清空备注的限制，前端提供前端拦截与提示保护；
  - 写操作超时或不确定异常时提示「提交结果未确认，请先查询核实」，锁定防重复提交。
- **验收状态**：**【未验收】**
- **具体阻碍**：
  - 后台微服务未运行，未提供获准写入的测试字典数据。

### 4. 参数维护与参数列表可选筛选后端校验核验点
- **接口契约与后端核验点**：
  - 查询列表：`GET /argument/list?pageNo=&pageSize=&configKey=&name=`
  - 新增与编辑：`POST /argument/add`、`POST /argument/edit`（按 `configKey` 定位，编码只读，多行文本原样保存）
  - **关键后端校验核验点（契约差异事实）**：
    - 根据 `docs/planning/assets/backend-contract.md` 源码核实，后端 `ArgumentListReqDTO` 在 `configKey` 和 `name` 字段上标注了 `@NotBlank` 注解；
    - 但 `ArgumentController.java` 的 `list` 接口方法形参上**缺少 `@Validated` 注解**；
    - 前端按可选筛选处理：未填写筛选时只传 `pageNo` 和 `pageSize`，不传空白 `configKey` 或 `name`。
    - **待真实联调验证点**：需在真实微服务环境下实测缺少 `@Validated` 时是否仍会触发参数校验报错（如是否存在全局 AOP 切面强行校验），还是如前端预期般作为可选筛选正常返回全量分页结果。严禁凭源码推断或模拟测试断言其必然通过，环境缺失时必须保留为此项核验点。
- **验收状态**：**【未验收】**
- **具体阻碍**：
  - 后端服务未运行，无法验证实际 Spring 容器中 `@Validated` 缺失下的运行时校验行为。

### 5. 跨模块一致性、无残留占位导航与无虚构统计
- **核验内容**：
  - **纯净路由与真实导航**：
    - 路由表仅包含真实交付的功能页面：`/accounts`（管理端账号）、`/dictionaries`（字典类型）、`/dictionaries/:typeKey/items`（字典项）、`/parameters`（参数维护）、`/workbench`（工作台就绪页）、`/login`（登录页）、`/:pathMatch(.*)*`（404 页面）；
    - 系统根路径 `/` 明确重定向至默认业务页 `/accounts`；
    - 主导航栏（`AppShell.vue`）精确对应 3 个业务功能入口，无任何假链接、禁用占位菜单或未实现功能的占位导航；
    - 404 页面提供统一返回默认页入口，且重定向参数经过严格安全白名单过滤（防反斜线、协议相对 `//` 及循环登录跳转）。
  - **无虚构统计**：
    - 工作台（`WorkbenchView.vue`）仅承载登录身份确认与明确边界说明，无任何虚构的统计卡片（如伪造的日活、交易量、访问看板等）。
  - **重新进入与表单生命周期一致性**：
    - 各模块重新进入或点击重置时恢复干净初始状态；
    - 各表单均实现脏检查：未保存离开页面或关闭弹窗时提示二次确认，未修改表单直接平滑关闭；
    - 认证失效（401）时所有打开的弹窗立即关闭，脏表单彻底清理，**绝对不自动重放任何写操作请求**；
    - 写操作不确定结果（网络断开、超时）时，保留输入并清晰提示核实，防止误导重复提交。
- **验收状态**：**【已验证】**
- **验证结论**：全模块路由、导航结构、表单生命周期与异常控制策略完全统一，测试断言全部通过。

---

## 待真实环境具备后的后续验收步骤（Runbook）

当获准提供完整微服务运行环境与测试凭据后，执行以下步骤完成最终闭环联调：

1. **环境启动与依赖验证**：
   - 启动基础中间件：MySQL（3306，执行基础 SQL 脚本初始化 `sys_user`、`sys_dictionary_*`、`sys_argument` 表结构与种子数据）、Redis（6379）、Nacos（8848）；
   - 启动微服务：`lien-gateway`（18080）、`lien-admin`（18081），确保网关路由与白名单生效。
2. **凭据准备**：
   - 准备获准的管理员账号（如 `13800138000` / `password123`），确认其在数据库中已存在且状态为启用；
   - 准备可用于新增和编辑测试的专用前缀测试数据（如 `test_` 标识），联调后便于核验。
3. **功能端到端核验**：
   - **登录与工作台**：输入手机号与密码登录，验证 AES 加密传输与网关放行，成功跳转工作台并正确展示管理员昵称；刷新页面验证会话恢复；手动退出验证会话清除；伪造令牌发起请求验证 401 统一拦截并跳转登录页。
   - **管理端账号**：验证账号列表精确筛选；新增账号并验证手机号重复校验提示；确认新增账号成功后在列表中正常呈现且身份/状态字典标签正确映射。
   - **字典类型与字典项**：验证类型与项的新增、前缀筛选、分页、只读字段锁定及编辑更新生效。
   - **参数维护与可选筛选核验**：
     - **重点**：在未填任何筛选条件时发起参数列表查询，核实服务端是否报 400 校验异常（验证 `@Validated` 缺失的实际表现）；
     - 验证参数的新增、多行值编辑与更新。

---

## 质量门禁与测试保障

- 新增 `tests/backend-integration.test.ts`，涵盖环境端口探测、统一 `Result<T>` 包裹与异常映射、参数可选筛选核验点、账号新增无 `userId` 约束、字典项分页完整性、纯净导航与无虚构统计、401 失效表单清理及不重放写请求等规格断言。
- 执行 `corepack pnpm test`：全仓 25 个测试套件，237 项测试用例全部通过。
- 执行 `corepack pnpm run check`：Prettier 格式、ESLint 零警告、vue-tsc 类型检查、Vitest 测试及 Vite 生产打包全部通过。
