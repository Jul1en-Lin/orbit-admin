# 首版后端候选契约交接

> 范围：个人学习用的管理端首版；不改后端、不做 C 端。以下是 **admin service 本地路径**（即控制器映射），不是已验证的浏览器网关 URL。网关路由、CORS、运行环境、已有登录账号及浏览器实际可达性均未实测，须由部署/认证议题确认；不得据此把任一候选接口标成 browser 可用。
>
> 源码基准：`/Users/lien/prj/Framework-Java`。行号均指该基准当前文件。

## 已选首版动作

| 页面/动作 | 候选接口 | 首版边界 |
| --- | --- | --- |
| 登录 | `POST /sys_user/login/password` | 保留；密码传输、令牌保存/发送、失效及退出交认证议题。 |
| 当前管理端账号 | `GET /sys_user/login/get_info` | 保留。 |
| 管理端账号列表、筛选 | `POST /sys_user/list` | 保留；无分页。 |
| 新增管理端账号 | `POST /sys_user/add_edit`，请求中**不传** `userId` | 仅新增；不做编辑、重置密码、停用，也不以占位密码绕过后端校验。 |
| 字典类型 | `GET /dictionary_type/list`、`POST /dictionary_type/add`、`POST /dictionary_type/edit` | list/add/edit；不删除；编辑时编码只读。 |
| 字典项（在一个类型内管理） | `GET /dictionary_data/list`、`POST /dictionary_data/add`、`POST /dictionary_data/edit` | list/add/edit；不删除；编辑时 `dataKey`（以及所属类型）只读。 |
| 参数 | `GET /argument/list`、`POST /argument/add`、`POST /argument/edit` | list/add/edit；不删除；编辑时 `configKey` 只读。 |

控制器映射见 `lien-admin/lien-admin-service/src/main/java/com/lien/adminservice/user/controller/SysUserController.java:L27-L80`、`dict/controller/DictionaryController.java:L31-L83`、`dict/controller/ArgumentController.java:L18-L52`。

## 统一包裹、分页与错误

所有上述控制器成功响应均为 `Result<T>`：`{ code: 200000, msg: "操作成功", data: T }`；字段精确为 `code:int`、`msg:String`、`data:T`（`lien-common/lien-common-domain/src/main/java/domain/Result.java:L8-L28`，成功码定义于 `EnumCode.java:L17`）。写操作的 `T` 为新增/更新记录 `Long id`。

三个分页 list 的 `data` 是 `BasePageVO<VO>`，**仅**含 `{ totals: Integer, totalPages: Integer, list: VO[] }`，不返回 `pageNo`、`pageSize`（`lien-common/lien-common-domain/src/main/java/domain/vo/BasePageVO.java:L8-L22`）。未传分页查询参数时 DTO 初值为 `pageNo=1`、`pageSize=10`；源码未声明正数、最大页大小或上限校验（`.../domain/dto/BasePageReqDTO.java:L6-L24`）。因此前端不要臆定最大值，正常表格只消费本页 `list` 与 `totals/totalPages`。

`Result` 失败时 `data` 为 `null`。全局异常处理把错误码前三位设为 HTTP 状态：校验 `400000 → HTTP 400`，类型不匹配 `400006 → 400`，令牌类 `401000`—`401004 → 401`，未找到 `404001 → 404`，方法不支持 `405000 → 405`，兜底 `500000 → 500`（`lien-common/lien-common-domain/src/main/java/domain/EnumCode.java:L25-L104`；`lien-common/lien-common-security/src/main/java/handler/GlobalExceptionHandler.java:L28-L130`）。无显式错误码的 `new ServiceException("…")` 默认 `500000/HTTP 500`；带 `INVALID_PARA` 的业务校验为 `400000/HTTP 400`（`.../domain/exception/ServiceException.java:L27-L45`）。服务层下列中文消息是当前源码事实，前端应按 `code` 处理，不把文案作为稳定机器契约。

## 管理端账号

### 登录与当前账号（认证细节移交）

- `POST /sys_user/login/password`，JSON：`phone`、`password` 均 `@NotBlank`（`.../user/domain/dto/PasswordLoginDTO.java:L9-L21`）；返回 `Result<{accessToken:String, expires:Long}>`（`lien-common/lien-common-domain/src/main/java/domain/vo/TokenVO.java:L10-L21`）。源码还显示密码被当作前端加密值处理；具体加密约定、认证请求头、刷新/退出与 401 交认证议题，不在这里规定。
- `GET /sys_user/login/get_info` 返回 `Result<SysUserLoginVO>`：`userToken:String`、`userId:Long`、`userName:String`、`loginTime:Long`、`expireTime:Long`、`nickName:String`、`identity:String`、`status:String`（`.../domain/vo/LoginUserVO.java:L9-L34`；`.../user/domain/vo/SysUserLoginVO.java:L10-L25`）。当前账号来自令牌上下文；令牌无效时源码抛 `401004/HTTP 401`（`.../user/service/impl/SysUserServiceImpl.java:L193-L211`）。

### list 与仅新增 add_edit

- `POST /sys_user/list`，JSON 可选过滤：`userId:Long`、`phoneNumber:String`、`status:String`；无 `@NotBlank`，全不传即查全部。返回 `Result<SysUserVO[]>`，**不是分页 VO**；每项精确字段：`userId:Long`、`identity:String`、`phoneNumber:String`、`nickName:String`、`status:String`、`remark:String`（`.../user/domain/dto/SysUserListReqDTO.java:L9-L27`、`.../user/domain/vo/SysUserVO.java:L9-L40`）。筛选为精确匹配：手机号在服务端加密后 `eq`、ID `eq`、状态 `eq`（`.../user/service/impl/SysUserServiceImpl.java:L164-L188`），没有模糊匹配或排序契约。
- `POST /sys_user/add_edit`，首版只用新增分支：JSON **不传 `userId`**，并传 `identity`、`phoneNumber`、`password`、`nickName`、`status`（均 `@NotBlank`），可选 `remark`；`password` 另有 `@Size(max=20)` 与正则 `^[a-zA-Z0-9]+$`，正则未给定自定义 message（`.../user/domain/dto/SysUserDTO.java:L14-L58`）。返回 `Result<Long>`。
- 新增的额外事实：手机号格式不合法、已占用、身份字典项不存在分别为 `400000/HTTP 400`；其中源码消息为“手机格式错误”“手机号已经被占用”“用户身份错误”（`.../user/service/impl/SysUserServiceImpl.java:L97-L129`）。身份仅按 `dataKey` 存在性校验，源码不限制其 `typeKey`，前端以本资产的 `admin` 选项集约束。

虽然后端同一路径有 `userId` 时会进入编辑分支，且可改 identity/nickName/status/remark、不可改手机号/密码（`.../user/service/impl/SysUserServiceImpl.java:L133-L153`），这不是首版能力，UI 不应调用该分支。

## 字典

### 类型

- `GET /dictionary_type/list?pageNo=&pageSize=&value=&typeKey=`：均 query。`value` 为向右前缀模糊（`value%`），`typeKey` 精确；空白值不加过滤（`.../dict/service/impl/SysDictionaryServiceImpl.java:L63-L88`）。返回 `Result<BasePageVO<DictTypeVO>>`；项为 `id:Long,typeKey:String,value:String,remark:String,status:Integer`（`lien-admin/lien-admin-api/src/main/java/com/lien/api/dict/domain/vo/DictTypeVO.java:L10-L35`）。
- `POST /dictionary_type/add` 与 `/edit`：JSON `value`、`typeKey` 都是 `@NotNull`（不是 `@NotBlank`，空字符串未被此注解拒绝），可选 `remark`（`.../dict/domain/dto/DictTypeWriteReqDTO.java:L10-L27`）；返回 `Result<Long>`。add 检查 typeKey 或 value 已存在，失败消息“字典类型的键或者值已存在”，默认 `500000/HTTP 500`（`.../SysDictionaryServiceImpl.java:L40-L59`）。edit 按 typeKey 定位，只更新 value/remark：类型编码不可改；不存在或 value 与其他类型冲突均为默认 `500000/HTTP 500`（`...:L92-L109`）。

### 项

- `GET /dictionary_data/list?typeKey=&value=&pageNo=&pageSize=`：`typeKey` 是 `@NotBlank`，`value` 可选且为向右前缀模糊（`value%`）；固定按 `sort ASC, id ASC`（`lien-admin/lien-admin-api/src/main/java/com/lien/api/dict/domain/dto/DictDataListReqDTO.java:L11-L23`；`.../SysDictionaryServiceImpl.java:L147-L175`）。返回 `Result<BasePageVO<DictDataVO>>`；项为 `id:Long,typeKey:String,dataKey:String,value:String,remark:String,sort:Integer,status:Integer`（`.../api/dict/domain/vo/DictDataVO.java:L10-L44`）。
- `POST /dictionary_data/add`：JSON `typeKey`、`dataKey`、`value` 均 `@NotBlank`，`remark`、`sort` 可选（`.../dto/DictDataAddReqDTO.java:L10-L38`）；返回 `Result<Long>`。父类型不存在、dataKey 或 value 已存在均抛默认 `500000/HTTP 500`（`.../SysDictionaryServiceImpl.java:L113-L143`）；dataKey/value 的重复检查不按 typeKey 分组，是全局检查。
- `POST /dictionary_data/edit`：JSON `dataKey`、`value` 均 `@NotBlank`，可选 `remark`、`sort`（`.../dto/DictDataEditReqDTO.java:L10-L32`）；返回 `Result<Long>`。按 dataKey 定位，且只更新 value、非 null 的 sort、非空白的 remark；不接收/不能修改 `typeKey` 与 `dataKey`（`.../SysDictionaryServiceImpl.java:L179-L203`）。不存在或 value 冲突为默认 `500000/HTTP 500`。

### 管理端账号表单的身份/状态选项

首版浏览器候选采用分页的公开控制器路由，而**不调用** `DictionaryFeignClient` 的 `/dictionary_data/type` 等内部服务调用接口（该接口声明见 `lien-admin/lien-admin-api/src/main/java/com/lien/api/dict/feign/DictionaryFeignClient.java:L14-L51`）：

- 身份：`GET /dictionary_data/list?typeKey=admin`；取每页 `data.list` 的 `dataKey` 作提交值、`value` 作标签。
- 状态：`GET /dictionary_data/list?typeKey=common_status`；同样用 `dataKey/value`。

这两个请求**都是分页接口**，所以一次响应只含当前页；若 UI 的语义是“完整选项集”，必须从默认第一页开始按 `totalPages` 逐页拉完（或逐页直到完结），不能把第一页当成一般性“全部”。当前已知只读实库证据中两个类型各只有两个所需项，默认 `pageSize=10` 恰会覆盖它们，但这不是源码硬编码，也不能推及未来数据或浏览器可达性。

实库只读证据（非源码硬编码）：`frameworkjava_dev` 中 `admin` 的 `platform_admin=平台管理员`、`super_admin=超级管理员`；`common_status` 的 `enable=启用`、`disable=停用`。这些字典类型和项的数值 `status` 都为 `1`，项的 `sort` 都为 `1`。注意字典项数值 `status` 与管理端账号提交的字符串 `status`（`enable`/`disable`）不同字段，不能混用。

## 参数

- `GET /argument/list?pageNo=&pageSize=&configKey=&name=`：返回 `Result<BasePageVO<ArgumentVO>>`，项字段为 `id:Long,name:String,configKey:String,value:String,remark:String`（`lien-admin/lien-admin-api/src/main/java/com/lien/api/dict/domain/vo/ArgumentVO.java:L11-L36`）。服务层的 `configKey` 是精确匹配，`name` 为包含式模糊 `LIKE '%name%'`（`.../dict/service/impl/SysArgumentServiceImpl.java:L54-L81`）。DTO 虽给 configKey/name 标了 `@NotBlank`（`.../dto/ArgumentListReqDTO.java:L12-L25`），但控制器 list 参数没有 `@Validated`（`.../dict/controller/ArgumentController.java:L40-L42`）；不能把该 GET 的必填校验当作已落实的 HTTP 行为，前端可按筛选可选处理，联调再验证。
- `POST /argument/add`：JSON `configKey`、`name`、`value` 均 `@NotBlank`，`remark` 可选；返回 `Result<Long>`（`.../dto/ArgumentAddReqDTO.java:L10-L33`）。configKey 已存在时消息“已存在参数主键”，默认 `500000/HTTP 500`（`.../SysArgumentServiceImpl.java:L33-L50`）。
- `POST /argument/edit`：JSON `configKey`、`name`、`value` 均 `@NotBlank`，`remark` 可选；返回 `Result<Long>`（`.../dto/ArgumentEditReqDTO.java:L10-L33`）。按 configKey 定位，只更新 name/value/（若非 null）remark，所以 configKey 编码不可改；不存在或名称与其他参数冲突为默认 `500000/HTTP 500`（`.../SysArgumentServiceImpl.java:L85-L107`）。

## 未能定论/后续核实

1. 本资产只证明源码的 service-local 映射；网关前缀/路由重写、白名单、CORS、实际鉴权头和浏览器预检未测，不能构成可用性结论。
2. 既有管理端登录账号是否能成功登录也未测；不记录凭据。认证传输细节与会话交认证议题。
3. 后端对参数 list 的 GET 约束注解是否实际触发存在控制器缺少 `@Validated` 的源码缺口，需联调验证；分页的非法/超大值亦无源码限制。
4. 后端只校验新增账号 identity 的 dataKey 存在，并未校验它归属 `admin`；`common_status`/`admin` 是实库证据驱动的前端映射，不是后端常量约束。
