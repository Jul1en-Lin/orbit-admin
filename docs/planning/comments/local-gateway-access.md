# 提供本地联调所需的网关配置与访问条件：核查记录

## 只读配置核查

用户提供了后端使用的远程 Nacos 访问条件。通过 Nacos API 登录后，只读查询配置与服务注册信息；未修改配置、未启动服务，未保存访问令牌或凭据。

- Nacos 地址、namespace 与 group 已脱敏；实际连接信息通过非仓库渠道提供。这是配置中心，不是业务 API 入口。
- 网关配置：`lien-gateway-<RUN_ENV>.yaml`，`server.port=18080`。
- admin 配置：`lien-admin-<RUN_ENV>.yaml`，`server.port=18081`。
- admin 网关路由：`Path=/admin/**` → `lb://lien-admin`，过滤器 `StripPrefix=1`；未配置 default-filters。
- 配置中未见 `server.ssl`；本地按 HTTP 默认启动后的候选网关地址为 `http://127.0.0.1:18080`，不是已验证的可用地址。
- 登录网关路径为 `/admin/sys_user/login/password`，转发至 admin 的 `/sys_user/login/password`。
- 白名单包含 `/**/login/**`，以及 `/admin/logout`、`/admin/register`、`/admin/codeLogin`、`/**/send_code/**`、`/**/nologin/**`、`/**/test/**`。白名单中的路径不证明对应接口存在。
- `AuthFilter` 读取请求路径并按白名单放行；`/**/login/**` 同样涵盖 `/admin/sys_user/login/get_info`。这不证明当前账号接口可匿名使用，其服务端认证行为仍须实测；不据此移除前端认证头或更改会话约定。
- 未见 gateway globalcors 配置；未实际验证 CORS/OPTIONS。既定前端接入采用同源代理，不要求浏览器直连网关。

## 启动配置与运行状态

源码的 gateway、admin `bootstrap.yml` 使用 `RUN_ENV` 与 `NACOS_ADDR`。实际环境标识和配置中心连接地址已脱敏，启动时通过非仓库渠道获取，不将占位符当作可用配置。

两者引用的共享配置 dataId 均在该 namespace/group 的列表中存在：`share-redis-<RUN_ENV>.yaml`、`share-mysql-<RUN_ENV>.yaml`、`share-map-<RUN_ENV>.yaml`、`share-rabbitmq-<RUN_ENV>.yaml`，以及 admin 引用的 `share-caffeine-<RUN_ENV>.yaml`。只确认配置记录存在，未验证其中依赖服务的连接与启动完整性，未导出共享配置中的秘密。

核查时：

- Nacos 返回 `lien-gateway`、`lien-admin` 的实例列表均为空。
- 本机 `lsof` 未发现 TCP 18080、18081 监听进程。
- 尚未尝试启动后端，不能判定服务一定能够或不能启动；没有登录、业务请求或浏览器联调通过的证据。

## 实现阶段的代理依据

基于所读配置，建议保持业务接口层的 service-local 路径，并将前端 `/api` 前缀替换为网关 `/admin` 前缀：

`/api/sys_user/login/password` → `http://127.0.0.1:18080/admin/sys_user/login/password` → admin `/sys_user/login/password`。

本地 Vite 与生产 Nginx 应保持相同路径语义；生产 upstream 需在部署时核实，不将 Nacos 主机当作网关主机。上述仅为配置推导，尚未实施代理或验证完整链路。

## 剩余验证与会话边界

配置访问缺口已补齐；剩余为后端启动、依赖连通性、真实请求与前端代理验证，属于实现与联调验收，不得以配置读取替代。

本会话已解决页面验收议题，遵循每会话最多解决一个非研究议题的约定，本任务暂保留 open；后续会话可据此记录 Resolution 并收口地图，不需要重复提供凭据。

访问地址为 HTTP，且凭据已在会话中明文分享；已建议更换密码。未擅自修改凭据或共享基础设施。

## Resolution

用户确认本任务可以关闭，作为本会话解决数量约定的一次例外。配置访问条件已提供，网关端口、admin 路由、前缀剥离与登录白名单已只读核实，详情见上文。

本任务按「获得访问条件并记录事实与剩余缺口」完成，不以服务成功启动作为关闭条件。后端启动、依赖连通性、真实登录与业务请求、代理链路及上线部署验证移交实现阶段，仍为未验收。规划地图据此收口，不再保留实现阶段的验证工作作为规划迷雾；不表示应用已实现或可交付。
