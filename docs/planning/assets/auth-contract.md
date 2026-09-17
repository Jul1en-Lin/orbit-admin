# 管理端认证源码核查

只读核查基准：`/Users/lien/prj/Framework-Java` 及本地 Maven 依赖。未连接数据库、未调用运行环境、未验证浏览器可达性，不记录密钥或凭据。

## 登录及密码传输

- service-local 路径：`POST /sys_user/login/password`，JSON 字段 `phone`、`password` 均非空。依据：`lien-admin/lien-admin-service/src/main/java/com/lien/adminservice/user/domain/dto/PasswordLoginDTO.java:9-21`、同模块 `user/controller/SysUserController.java:39-44`。
- 手机号由后端校验并加密查询；前端应提交手机号文本，而非自行加密手机号。密码先由后端 AES Hex 解密，再将明文做 SHA-256 与存储摘要比较。依据：同模块 `user/service/impl/SysUserServiceImpl.java:50-88`。
- 兼容契约为 AES-128/ECB/PKCS5Padding、UTF-8 明文、Hex 密文；密钥字符串按 UTF-8 得到 16 字节。依据：`lien-common/lien-common-core/src/main/java/com/lien/common/core/utils/AESUtil.java:16,23-37`；根 `pom.xml:47,90-95` 指定 Hutool 5.8.25；本地 `~/.m2/repository/cn/hutool/hutool-all/5.8.25/hutool-all-5.8.25-sources.jar` 中 `cn/hutool/crypto/symmetric/AES.java:16,38-50` 明确默认模式。JavaScript 侧采用 AES 块大小的 PKCS#7 填充与其兼容，具体实现必须以测试向量核对。
- 浏览器固定密钥只能兼容现有契约，不提供可靠保密性，不替代 HTTPS；不在日志、规划文档中记录实际密钥或登录密码。
- 手机号格式错误为 `400003`，不存在或密码错误为 `400000`，禁用账号为 `400007`，HTTP 均为 400。依据：上述登录 service 及 `lien-common/lien-common-security/src/main/java/handler/GlobalExceptionHandler.java`。前端不靠消息文本判断认证状态。

## 令牌与当前账号

- 请求头采用 `Authorization: Bearer <accessToken>`。依据：`lien-common/lien-common-domain/src/main/java/domain/constants/SecurityConstants.java:28-31`、`TokenConstants.java:13-16`；`lien-common/lien-common-security/src/main/java/utils/SecurityUtil.java:20-23,40-45`。
- 登录返回 `accessToken` 和 `expires`；后者为毫秒时长，当前源码是 12 小时，而非时间戳。`loginTime`、`expireTime` 才是 epoch 毫秒时间戳。依据：同 security 模块 `service/TokenService.java:34-37,66-84`。
- `GET /sys_user/login/get_info` 查询当前管理端账号。未发现它触发续期；全仓库仅发现内部 `refreshToken` 定义，没有调用点，也未发现可供前端调用的刷新接口。依据：admin service `user/controller/SysUserController.java:77-80`、`user/service/impl/SysUserServiceImpl.java:193-211`；security `service/TokenService.java:94-125,166-171`。
- 未发现管理端主动退出 HTTP 接口。内部删除登录缓存能力不等于已提供退出接口；portal 的退出接口不应用于管理端。
- 网关及 service 使用 `Result {code,msg,data}`。网关认证失败 HTTP 401，业务码包含 `401000`、`401001`、`401003`、`401004`。依据：`lien-gateway/src/main/java/com/lien/gateway/filter/AuthFilter.java:55-86,135-141`、common core `utils/ServletUtil.java:57-77`。

## 尚未验证

网关路由及白名单来自外部 Nacos 配置；仓库未提供实际路由、白名单或已验证 CORS 配置。上述路径不是已验证浏览器 URL。实际网关配置、浏览器预检、可用测试账号及一次完整登录仍须联调核实。密码算法虽有源码依据，尚未完成浏览器实现与 Java 的互操作测试。
