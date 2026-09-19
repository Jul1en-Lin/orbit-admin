<script setup lang="ts">
import { useRouter } from 'vue-router'
import AppShell from '../components/AppShell.vue'

const router = useRouter()

function navigateTo(path: string) {
  router.push(path)
}
</script>

<template>
  <AppShell>
    <div class="workbench-container">
      <section class="scaffolds-section" aria-labelledby="scaffolds-title">
        <div class="scaffolds-header">
          <h1 id="scaffolds-title" class="scaffolds-title">脚手架工程体系</h1>
          <p class="scaffolds-intro">
            前后端解耦的独立脚手架体系。前端纯静态独立演进并适配网关代理，后端提供高内聚微服务集群与标准化契约底座。
          </p>
        </div>

        <div class="scaffolds-grid">
          <!-- 前端脚手架卡片 -->
          <article class="scaffold-card scaffold-card--frontend">
            <div class="card-head">
              <div class="card-tag card-tag--purple">
                <span class="tag-dot" />
                <span>前端脚手架</span>
              </div>
              <span class="scaffold-name">Orbit Admin</span>
            </div>

            <div class="card-main">
              <div class="scaffold-icon scaffold-icon--purple">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polygon points="12 2 2 7 12 12 22 7 12 2" />
                  <polyline points="2 17 12 22 22 17" />
                  <polyline points="2 12 12 17 22 12" />
                </svg>
              </div>
              <div class="card-title-group">
                <h3>前端脚手架 · Orbit Admin</h3>
                <p class="card-subtitle">面向 B 端管理场景的独立纯静态管理端脚手架</p>
              </div>
            </div>

            <p class="card-desc">
              开箱即用交付统一登录鉴权、会话持久化与刷新恢复治理、受保护路由守卫及基础管理模块。下游业务可直接复制代码库独立演进，天然适配纯静态
              Nginx 托管与同源网关代理。
            </p>

            <div class="tech-pills">
              <span class="tech-pill tech-pill--purple">Vue</span>
              <span class="tech-pill tech-pill--purple">Vite</span>
              <span class="tech-pill tech-pill--purple">TypeScript</span>
              <span class="tech-pill tech-pill--purple">Pinia</span>
              <span class="tech-pill tech-pill--purple">Vue Router</span>
              <span class="tech-pill tech-pill--purple">Element Plus</span>
              <span class="tech-pill tech-pill--purple">Axios</span>
            </div>

            <!-- 公共基础部分 -->
            <div class="detail-block">
              <div class="detail-badge detail-badge--purple">公共基础部分</div>
              <div class="feature-list">
                <div class="feature-item">
                  <span class="feature-bullet feature-bullet--purple" />
                  <div class="feature-text">
                    <strong>工程基线</strong>：Vue + Vite + Element Plus 标准工程，按需集成组件并注入深墨绿设计规范。
                  </div>
                </div>
                <div class="feature-item">
                  <span class="feature-bullet feature-bullet--purple" />
                  <div class="feature-text">
                    <strong>网络底座</strong>：Pinia + Axios 统一客户端，解包 <code>Result&lt;T&gt;</code>，基于
                    <code>sessionSeq</code> 隔离晚到响应与并发 401 收敛。
                  </div>
                </div>
                <div class="feature-item">
                  <span class="feature-bullet feature-bullet--purple" />
                  <div class="feature-text">
                    <strong>路由守卫</strong>：Vue Router
                    纯静态路由回退、受保护路由拦截、登录态静默恢复与防越权安全重定向。
                  </div>
                </div>
                <div class="feature-item">
                  <span class="feature-bullet feature-bullet--purple" />
                  <div class="feature-text">
                    <strong>安全防串序</strong>：CryptoJS AES 密码传输加密对齐后端，单调递增
                    <code>querySeq</code> 彻底消除异步查询相互覆盖。
                  </div>
                </div>
              </div>
            </div>

            <!-- 公共业务部分 -->
            <div class="detail-block detail-block--separated">
              <div class="detail-badge detail-badge--purple">公共业务部分</div>
              <div class="feature-list">
                <div class="feature-item">
                  <span class="feature-bullet feature-bullet--purple" />
                  <div class="feature-text">
                    <strong>登录页</strong>：账号密码表单校验、AES
                    密文加密通信、防重复提交互斥锁与失效感知平滑重试降级。
                  </div>
                </div>
                <div class="feature-item">
                  <span class="feature-bullet feature-bullet--purple" />
                  <div class="feature-text">
                    <strong>布局页</strong>：AppShell 毛玻璃吸顶顶栏骨架、品牌工作台跳转、主导航指示器及一键安全退出。
                  </div>
                </div>
                <div class="feature-item">
                  <span class="feature-bullet feature-bullet--purple" />
                  <div class="feature-text">
                    <strong>用户管理</strong>：平台账号检索、字典动态映射驱动、超时未确认防重复提交与脏表单防丢失。
                  </div>
                </div>
                <div class="feature-item">
                  <span class="feature-bullet feature-bullet--purple" />
                  <div class="feature-text">
                    <strong>系统管理</strong>：字典类型分页与同构增改、字典项维护；参数精准匹配与多行文本灵活配置。
                  </div>
                </div>
                <div class="feature-item">
                  <span class="feature-bullet feature-bullet--purple" />
                  <div class="feature-text">
                    <strong>错误页</strong>：404 未定义路径全匹配捕获、深墨绿视觉轨道呈现与一键安全返回管理端工作台。
                  </div>
                </div>
              </div>
            </div>
          </article>

          <!-- 后端脚手架卡片 -->
          <article class="scaffold-card scaffold-card--backend">
            <div class="card-head">
              <div class="card-tag card-tag--teal">
                <span class="tag-dot tag-dot--teal" />
                <span>后端脚手架</span>
              </div>
              <span class="scaffold-name">Framework-Java</span>
            </div>

            <div class="card-main">
              <div class="scaffold-icon scaffold-icon--teal">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="2" y="2" width="20" height="8" rx="2" ry="2" />
                  <rect x="2" y="14" width="20" height="8" rx="2" ry="2" />
                  <line x1="6" y1="6" x2="6.01" y2="6" />
                  <line x1="6" y1="18" x2="6.01" y2="18" />
                </svg>
              </div>
              <div class="card-title-group">
                <h3>后端脚手架 · Framework-Java</h3>
                <p class="card-subtitle">基于 Java、Spring Boot 与 Spring Cloud 的微服务脚手架</p>
              </div>
            </div>

            <p class="card-desc">
              Framework-Java 是一个基于 Java 17、Spring Boot和 Spring Cloud
              的微服务脚手架，便于快速搭建后台管理系统与各种业务。
            </p>

            <!-- 技术选型分类展示 -->
            <div class="tech-categorized">
              <div class="tech-category-row">
                <span class="category-name">框架</span>
                <div class="category-items">
                  <span class="tech-pill tech-pill--teal">Spring Boot</span>
                  <span class="tech-pill tech-pill--teal">Spring Cloud</span>
                  <span class="tech-pill tech-pill--teal">OpenFeign</span>
                </div>
              </div>

              <div class="tech-category-row">
                <span class="category-name">网关</span>
                <div class="category-items">
                  <span class="tech-pill tech-pill--teal">Gateway</span>
                  <span class="tech-pill tech-pill--teal">Nginx</span>
                  <span class="tech-pill tech-pill--teal">Nacos</span>
                </div>
              </div>

              <div class="tech-category-row">
                <span class="category-name">中间件</span>
                <div class="category-items">
                  <span class="tech-pill tech-pill--teal">Redis</span>
                  <span class="tech-pill tech-pill--teal">Redisson</span>
                  <span class="tech-pill tech-pill--teal">Caffeine</span>
                  <span class="tech-pill tech-pill--teal">RabbitMQ</span>
                </div>
              </div>

              <div class="tech-category-row">
                <span class="category-name">数据存储</span>
                <div class="category-items">
                  <span class="tech-pill tech-pill--teal">MySQL</span>
                  <span class="tech-pill tech-pill--teal">MyBatis-Plus</span>
                </div>
              </div>

              <div class="tech-category-row">
                <span class="category-name">第三方工具</span>
                <div class="category-items">
                  <span class="tech-pill tech-pill--teal">JJWT</span>
                  <span class="tech-pill tech-pill--teal">Hutool</span>
                  <span class="tech-pill tech-pill--teal">阿里云 OSS</span>
                  <span class="tech-pill tech-pill--teal">腾讯地图</span>
                </div>
              </div>
            </div>

            <!-- 模块结构与服务职责（重新排版工程文件树） -->
            <div class="detail-block">
              <div class="detail-badge detail-badge--teal">模块结构与工程树</div>
              <p class="section-lead section-lead--emphasis">
                系统按功能将微服务与基础组件分模块管理，职责清晰，在服务调用上采用接口继承方式：
              </p>
              <ol class="contract-steps">
                <li>
                  在 <code>*-api</code> 模块中声明 <code>FeignClient</code> 接口，包含方法路径、入参注解和返回值。
                </li>
                <li>
                  在 <code>*-service</code> 模块的 Controller 中直接实现对应的 <code>FeignClient</code> 接口。
                </li>
              </ol>

              <div class="project-tree">
                <div class="tree-header">
                  <div class="tree-window-controls">
                    <span class="tree-dot-btn tree-dot-btn--red" />
                    <span class="tree-dot-btn tree-dot-btn--yellow" />
                    <span class="tree-dot-btn tree-dot-btn--green" />
                  </div>
                </div>

                <div class="tree-content">
                  <!-- 根节点 -->
                  <div class="tree-row tree-row--root">
                    <span class="tree-name tree-name--root">Framework-Java/</span>
                  </div>

                  <!-- 树节点: lien-gateway -->
                  <div class="tree-row">
                    <span class="tree-branch">├──</span>
                    <span class="tree-name">lien-gateway</span>
                    <span class="tree-comment"># 统一网关服务</span>
                  </div>

                  <!-- 树节点: lien-admin -->
                  <div class="tree-row">
                    <span class="tree-branch">├──</span>
                    <span class="tree-name">lien-admin</span>
                    <span class="tree-tags">
                      <span class="tree-tag">api</span>
                      <span class="tree-tag">service</span>
                    </span>
                    <span class="tree-comment"># 后台管理与通用中台服务</span>
                  </div>

                  <!-- 树节点: lien-portal -->
                  <div class="tree-row">
                    <span class="tree-branch">├──</span>
                    <span class="tree-name">lien-portal</span>
                    <span class="tree-tags">
                      <span class="tree-tag">api</span>
                      <span class="tree-tag">service</span>
                    </span>
                    <span class="tree-comment"># C端移动应用门户服务</span>
                  </div>

                  <!-- 树节点: lien-file -->
                  <div class="tree-row">
                    <span class="tree-branch">├──</span>
                    <span class="tree-name">lien-file</span>
                    <span class="tree-tags">
                      <span class="tree-tag">api</span>
                      <span class="tree-tag">service</span>
                    </span>
                    <span class="tree-comment"># 对象存储与文件上传服务</span>
                  </div>

                  <!-- 树节点: lien-mstemplate -->
                  <div class="tree-row">
                    <span class="tree-branch">├──</span>
                    <span class="tree-name">lien-mstemplate</span>
                    <span class="tree-tags">
                      <span class="tree-tag">api</span>
                      <span class="tree-tag">service</span>
                    </span>
                    <span class="tree-comment"># 业务微服务工程模板</span>
                  </div>

                  <!-- 树节点: lien-common -->
                  <div class="tree-row tree-row--group">
                    <span class="tree-branch">└──</span>
                    <span class="tree-name tree-name--group">lien-common/</span>
                    <span class="tree-comment"># 通用基础组件包</span>
                  </div>

                  <!-- 二级子包列表 -->
                  <div class="tree-subgroup">
                    <div class="tree-row tree-row--sub">
                      <span class="tree-branch">├──</span>
                      <span class="tree-name">lien-common-domain</span>
                      <span class="tree-comment"># 统一响应模型、状态码枚举与分页基类</span>
                    </div>
                    <div class="tree-row tree-row--sub">
                      <span class="tree-branch">├──</span>
                      <span class="tree-name">lien-common-security</span>
                      <span class="tree-comment"># JWT/Redis会话管理与全局异常处理器</span>
                    </div>
                    <div class="tree-row tree-row--sub">
                      <span class="tree-branch">├──</span>
                      <span class="tree-name">lien-common-cache</span>
                      <span class="tree-comment"># Caffeine + Redis 两级缓存服务</span>
                    </div>
                    <div class="tree-row tree-row--sub">
                      <span class="tree-branch">├──</span>
                      <span class="tree-name">lien-common-redis</span>
                      <span class="tree-comment"># Redis 基础操作与 Redisson 分布式锁</span>
                    </div>
                    <div class="tree-row tree-row--sub">
                      <span class="tree-branch">├──</span>
                      <span class="tree-name">lien-common-rabbitmq</span>
                      <span class="tree-comment"># MQ JSON 序列化与时间格式配置</span>
                    </div>
                    <div class="tree-row tree-row--sub">
                      <span class="tree-branch">└──</span>
                      <span class="tree-name">lien-common-core</span>
                      <span class="tree-comment"># 动态线程池、加解密与核心工具类</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- 微服务职责详述 -->
            <div class="detail-block detail-block--separated">
              <div class="detail-badge detail-badge--teal">微服务服务职责</div>
              <div class="feature-list">
                <div class="feature-item">
                  <span class="feature-bullet feature-bullet--teal" />
                  <div class="feature-text">
                    <strong>后台管理服务</strong>：承载后台管理系统运营功能
                    <ol>
                      <li>
                        <strong>参数服务</strong>：系统运行时支持动态配置各种参数，微服务按配置键实时读取全局参数，减少业务常量硬编码。
                      </li>
                      <li>
                        <strong>字典服务</strong>：维护字典类型与字典数据项。除后台基础增删改查外，对外提供 Feign 接口远程调用，支持单类型查询、多类型批量查询以及按 key 获取字典项功能。
                      </li>
                      <li>
                        <strong>用户管理</strong>：统一管理 B 端管理员与 C 端用户档案。手机号入库前进行对称加密存储，登录密码支持前端密文传输并在后端加盐校验比对，支持账号禁用与状态流转控制。
                      </li>
                      <li>
                        <strong>地图与区划服务</strong>：内置全国省市区三级行政区划数据，支持多层级查询、热门城市以及城市拼音首字母（A~Z）索引归类；服务启动时自动对城市区划数据进行两级缓存预热，减少启动时的首次访问负担。同时集成第三方腾讯地图服务，实现 POI 关键词搜索和经纬度逆地址解析。
                      </li>
                    </ol>
                  </div>
                </div>

                <div class="feature-item">
                  <span class="feature-bullet feature-bullet--teal" />
                  <div class="feature-text">
                    <strong>业务微服务工程模板</strong>：为新创建的业务微服务提供标准参考工程，分为 api 接口与 service 实现模块
                    <ol>
                      <li>
                        <strong>核心功能支持</strong>：内置两级缓存读写与回填、异步线程池任务调度，以及消息队列生产消费与监听处理的完整示例。
                      </li>
                      <li>
                        <strong>预置配置</strong>：包含服务注册发现、集中式配置读取、数据库持久化及代码分层规范，复制工程即可快速开启新业务开发。
                      </li>
                    </ol>
                  </div>
                </div>

                <div class="feature-item">
                  <span class="feature-bullet feature-bullet--teal" />
                  <div class="feature-text">
                    <strong>对象存储服务</strong>：提供统一的文件存储抽象接口，屏蔽底层云厂商 SDK 封装细节，当前对接阿里云 OSS
                    <ol>
                      <li>
                        <strong>文件访问与预览</strong>：提供带签名或公网地址的文件路径拼装，可直接访问下载。
                      </li>
                      <li>
                        <strong>后端中继上传</strong>：微服务接收文件输入流，生成 UUID 路径前缀保证文件不重名，调用 OSSClient 上传，并设置公共读权限。
                      </li>
                      <li>
                        <strong>前端直传 V4 签名</strong>：服务端根据阿里云 OSS V4 签名规范生成临时授权凭证，前端拿此凭据直接向 OSS 提交文件，文件上传过程不经过应用网关，节省服务端带宽。
                      </li>
                    </ol>
                  </div>
                </div>

                <div class="feature-item">
                  <span class="feature-bullet feature-bullet--teal" />
                  <div class="feature-text">
                    <strong>C 端门户服务</strong>：面向移动端 App、H5 与微信小程序等 C 端用户业务
                    <ol>
                      <li>
                        <strong>用户业务接入</strong>：提供微信授权登录、手机号注册登录、密码登录以及退出登录接口。
                      </li>
                      <li>
                        <strong>解耦</strong>：通过 Feign 远程调用用户与配置接口，实现前台业务流程与后台数据处理/存储解耦。
                      </li>
                    </ol>
                  </div>
                </div>

                <div class="feature-item">
                  <span class="feature-bullet feature-bullet--teal" />
                  <div class="feature-text">
                    <strong>网关服务</strong>：基于 WebFlux 响应式架构构建，统一处理外部请求的路由调度与安全拦截
                    <ol>
                      <li>
                        <strong>白名单机制</strong>：读取无需鉴权的路径清单，匹配成功直接放行。
                      </li>
                      <li>
                        <strong>网关异常处理</strong>：捕获网关阶段抛出的路由未找到、服务离线及鉴权失败等异常，按统一的 Result 结构直接写回 JSON 报文，保证返回前端的结果一致。
                      </li>
                      <li>
                        <strong>统一鉴权与状态校验</strong>：拦截请求并解析 Token 令牌凭证，校验签名有效性，并联动 Redis 校验用户登录态是否过期。鉴权通过后自动将用户信息保留，传给下游业务微服务，使下游服务无需编写重复的鉴权代码。
                      </li>
                    </ol>
                  </div>
                </div>
              </div>
            </div>

            <!-- 基础组件库 -->
            <div class="detail-block detail-block--separated">
              <div class="detail-badge detail-badge--teal">基础组件库</div>
              <p class="section-lead">公共代码下沉到独立子模块中，各微服务按需依赖：</p>
              <div class="feature-list">
                <div class="feature-item">
                  <span class="feature-bullet feature-bullet--teal" />
                  <div class="feature-text">
                    <strong>统一响应与异常处理</strong>：接口统一返回 <code>Result&lt;T&gt;</code>。错误码采用 6
                    位编码，前 3 位对齐 HTTP 状态码（例如 400xxx 对应 400 客户端错误，500xxx 对应 500 服务端错误），后 3
                    位为业务明细码；<code>GlobalExceptionHandler</code> 拦截 Controller 抛出的
                    <code>ServiceException</code>，并将 HTTP Response 状态码同步更新为 6 位错误码的前 3 位；捕获
                    <code>MethodArgumentNotValidException</code> 和
                    <code>ConstraintViolationException</code> 提取校验失败信息并合并为逗号分隔字符串；拦截 404、405
                    及未捕获 Exception 兜底。
                  </div>
                </div>

                <div class="feature-item">
                  <span class="feature-bullet feature-bullet--teal" />
                  <div class="feature-text">
                    <strong>认证与会话</strong>：<code>TokenService</code> 根据登录用户信息生成 JWT，同时在 Redis
                    中写入以随机 UUID
                    为键的会话记录并设置失效时间。支持每次登录生成新会话并清除同一用户历史令牌，严谨控制单点登录。
                  </div>
                </div>

                <div class="feature-item">
                  <span class="feature-bullet feature-bullet--teal" />
                  <div class="feature-text">
                    <strong>两级缓存</strong>：<code>CacheService</code> 结合 Caffeine 本地缓存（L1）和 Redis
                    分布式缓存（L2）。查询时先读本地缓存，本地未命中查 Redis，Redis
                    命中后自动回填本地缓存；两层均未命中时再查数据库。
                  </div>
                </div>

                <div class="feature-item">
                  <span class="feature-bullet feature-bullet--teal" />
                  <div class="feature-text">
                    <strong>分布式锁与 Redis</strong>：<code>RedissonLockService</code> 基于 Redisson
                    客户端封装分布式锁，获取锁时未指定租期即自动开启看门狗定时续期，防止业务逻辑未执行完毕锁失效，并要求释放锁必须在持有锁的同一线程执行；
                    <code>RedisService</code> 封装常用的字符串、哈希、列表等数据结构操作。
                  </div>
                </div>

                <div class="feature-item">
                  <span class="feature-bullet feature-bullet--teal" />
                  <div class="feature-text">
                    <strong>消息队列配置</strong>：<code>RabbitMqConfig</code> 配置
                    <code>Jackson2JsonMessageConverter</code>，通过 <code>mqObjectMapper</code> 注册
                    <code>JavaTimeModule</code>，强制将 <code>LocalDateTime</code> 等时间类型按
                    <code>yyyy-MM-dd HH:mm:ss</code> 格式序列化为 JSON
                    字符串，解决跨语言或不同版本反序列化格式不兼容问题。
                  </div>
                </div>

                <div class="feature-item">
                  <span class="feature-bullet feature-bullet--teal" />
                  <div class="feature-text">
                    <strong>核心工具集</strong>：<code>ThreadPoolConfig</code> 配置
                    <code>ThreadPoolTaskExecutor</code>，开放 <code>corePoolSize</code>、<code>maxPoolSize</code>、
                    <code>queueCapacity</code> 和 <code>keepAliveSeconds</code> 等属性，设置
                    <code>waitForTasksToCompleteOnShutdown</code> 确保容器停止时等待任务跑完，支持配置
                    <code>CallerRunsPolicy</code> 拒绝策略；<code>AESUtil</code> 提供敏感信息对称加解密；
                    <code>JsonUtil</code> 封装 Jackson 对象的序列化、反序列化与泛型转换；
                    <code>BeanUtil</code>、<code>PageUtil</code>、<code>VerifyUtil</code>
                    分别提供属性浅拷贝、分页结果组装和常用格式校验。
                  </div>
                </div>
              </div>
            </div>


          </article>
        </div>
      </section>

      <section class="modules-section" aria-label="核心功能入口">
        <h2 class="modules-title">已交付管理模块</h2>
        <div class="module-cards">
          <article
            class="module-card"
            role="button"
            tabindex="0"
            @click="navigateTo('/accounts')"
            @keydown.enter="navigateTo('/accounts')"
          >
            <div class="card-icon-wrap card-icon-wrap--orange">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <div class="card-text">
              <div class="card-header">
                <h3>管理端账号</h3>
                <span class="card-arrow">↗</span>
              </div>
              <p>查看管理端人员名录，精确检索账号 ID 与手机号，定位团队成员权限与工作状态。</p>
            </div>
          </article>

          <article
            class="module-card"
            role="button"
            tabindex="0"
            @click="navigateTo('/dictionaries')"
            @keydown.enter="navigateTo('/dictionaries')"
          >
            <div class="card-icon-wrap card-icon-wrap--teal">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                <line x1="9" y1="7" x2="15" y2="7" />
                <line x1="9" y1="11" x2="13" y2="11" />
              </svg>
            </div>
            <div class="card-text">
              <div class="card-header">
                <h3>数据字典</h3>
                <span class="card-arrow">↗</span>
              </div>
              <p>系统业务枚举分类根基，支持按编码与名称查询字典类型，维护各项字典枚举值与排序。</p>
            </div>
          </article>

          <article
            class="module-card"
            role="button"
            tabindex="0"
            @click="navigateTo('/parameters')"
            @keydown.enter="navigateTo('/parameters')"
          >
            <div class="card-icon-wrap card-icon-wrap--indigo">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="3" />
                <path
                  d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"
                />
              </svg>
            </div>
            <div class="card-text">
              <div class="card-header">
                <h3>系统配置参数</h3>
                <span class="card-arrow">↗</span>
              </div>
              <p>全局键值参数配置总控，按参数键名精确匹配或按名称包含搜索，支持灵活多行文本录入。</p>
            </div>
          </article>
        </div>
      </section>
    </div>
  </AppShell>
</template>

<style lang="scss" scoped>
.workbench-container {
  display: flex;
  flex-direction: column;
  gap: 2.75rem;
}

.scaffolds-section {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.scaffolds-header {
  display: flex;
  flex-direction: column;
}

.scaffolds-title {
  margin: 0 0 0.6rem;
  color: var(--orbit-ink);
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', Roboto, sans-serif;
  font-size: clamp(1.85rem, 3vw, 2.35rem);
  font-weight: 700;
  letter-spacing: -0.02em;
  line-height: 1.2;
}

.scaffolds-intro {
  max-width: none;
  white-space: nowrap;
  margin: 0;
  color: var(--orbit-body-muted);
  font-size: 0.98rem;
  line-height: 1.65;
}

.scaffolds-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1.75rem;
  align-items: start;
}

.scaffold-card {
  display: flex;
  flex-direction: column;
  padding: 2rem 2.25rem;
  background: var(--orbit-paper);
  border: 1px solid var(--orbit-line-soft);
  border-radius: 16px;
  box-shadow: 0 4px 20px -2px rgba(21, 59, 54, 0.06);
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);

  &:hover {
    box-shadow: 0 12px 28px -4px rgba(21, 59, 54, 0.1);
    border-color: rgba(186, 181, 219, 0.45);
  }

  &--frontend:hover {
    border-color: rgba(186, 181, 219, 0.45);
  }

  &--backend:hover {
    border-color: rgba(121, 168, 142, 0.45);
  }
}

.card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.25rem;
}

.card-tag {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  padding: 0.25rem 0.65rem;
  border-radius: 9999px;

  &--purple,
  &--orange {
    background: rgba(186, 181, 219, 0.16);
    color: #bab5db;
    border: 1px solid rgba(186, 181, 219, 0.35);
  }

  &--teal {
    background: rgba(121, 168, 142, 0.15);
    color: #79a88e;
    border: 1px solid rgba(121, 168, 142, 0.3);
  }
}

.tag-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: currentColor;
}

.scaffold-name {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--orbit-body-muted);
  letter-spacing: 0.02em;
}

.card-main {
  display: flex;
  align-items: center;
  gap: 1.1rem;
  margin-bottom: 1rem;
}

.scaffold-icon {
  display: grid;
  place-items: center;
  width: 3.2rem;
  height: 3.2rem;
  border-radius: 12px;
  flex-shrink: 0;

  svg {
    width: 1.7rem;
    height: 1.7rem;
  }

  &--purple,
  &--orange {
    background: rgba(186, 181, 219, 0.16);
    color: #bab5db;
  }

  &--teal {
    background: rgba(121, 168, 142, 0.15);
    color: #79a88e;
  }
}

.card-title-group {
  h3 {
    margin: 0 0 0.25rem;
    color: var(--orbit-ink);
    font-size: 1.25rem;
    font-weight: 700;
    letter-spacing: -0.01em;
  }
}

.card-subtitle {
  margin: 0;
  color: var(--orbit-body-muted);
  font-size: 0.88rem;
  line-height: 1.4;
}

.card-desc {
  margin: 0 0 1.25rem;
  color: var(--orbit-body-muted);
  font-size: 0.92rem;
  line-height: 1.68;
}

.tech-pills {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  margin-bottom: 1.5rem;
}

.tech-categorized {
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
  margin-bottom: 1.5rem;
  padding: 0.85rem 1rem;
  background: rgba(121, 168, 142, 0.06);
  border: 1px solid rgba(121, 168, 142, 0.2);
  border-radius: 10px;
}

.tech-category-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;

  @media (max-width: 640px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.35rem;
  }
}

.category-name {
  flex-shrink: 0;
  width: 4.8rem;
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--orbit-ink);
  letter-spacing: 0.02em;
}

.category-items {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.35rem;
}

.tech-pill {
  padding: 0.2rem 0.55rem;
  border-radius: 6px;
  font-size: 0.72rem;
  font-weight: 600;
  background: rgba(186, 181, 219, 0.14);
  color: #bab5db;
  border: 1px solid rgba(186, 181, 219, 0.32);

  &--purple,
  &--orange {
    background: rgba(186, 181, 219, 0.14);
    color: #bab5db;
    border-color: rgba(186, 181, 219, 0.32);
  }

  &--teal {
    background: rgba(121, 168, 142, 0.12);
    color: #79a88e;
    border-color: rgba(121, 168, 142, 0.3);
  }
}

.detail-block {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding-top: 1.25rem;
  border-top: 1px solid var(--orbit-line-soft);

  &--separated {
    margin-top: 1.25rem;
  }
}

.detail-badge {
  display: inline-flex;
  align-items: center;
  width: fit-content;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  padding: 0.2rem 0.6rem;
  border-radius: 4px;
  text-transform: uppercase;

  &--purple,
  &--orange {
    background: rgba(186, 181, 219, 0.16);
    color: #bab5db;
    border: 1px solid rgba(186, 181, 219, 0.35);
  }

  &--teal {
    background: rgba(121, 168, 142, 0.15);
    color: #79a88e;
    border: 1px solid rgba(121, 168, 142, 0.3);
  }
}

.feature-list {
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
}

.feature-item {
  display: flex;
  align-items: flex-start;
  gap: 0.6rem;
  font-size: 0.84rem;
  color: var(--orbit-body-muted);
  line-height: 1.55;

  strong {
    color: var(--orbit-ink);
    font-weight: 600;
  }

  ul {
    list-style: none;
    margin: 0.45rem 0 0.25rem;
    padding-left: 0.85rem;
    display: flex;
    flex-direction: column;
    gap: 0.35rem;

    li {
      line-height: 1.55;
    }
  }

  ol {
    margin: 0.45rem 0 0.25rem;
    padding-left: 1.25rem;
    display: flex;
    flex-direction: column;
    gap: 0.35rem;

    li {
      line-height: 1.55;
    }
  }

  code {
    padding: 0.1rem 0.35rem;
    border-radius: 4px;
    background: rgba(21, 59, 54, 0.06);
    color: var(--orbit-ink);
    font-size: 0.8em;
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  }
}

.feature-text {
  flex: 1;
}

.feature-bullet {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  margin-top: 0.5rem;
  flex-shrink: 0;

  &--purple,
  &--orange {
    background: #bab5db;
  }

  &--teal {
    background: #79a88e;
  }
}

.section-lead {
  margin: 0 0 0.4rem;
  color: var(--orbit-body-muted);
  font-size: 0.86rem;
  line-height: 1.55;

  &--emphasis {
    color: var(--orbit-body);
  }
}

.contract-steps {
  margin: 0.35rem 0 0.6rem;
  padding-left: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  font-size: 0.84rem;
  color: var(--orbit-body-muted);
  line-height: 1.6;

  li {
    word-break: break-word;
  }

  code {
    padding: 0.08rem 0.3rem;
    border-radius: 4px;
    background: rgba(21, 59, 54, 0.06);
    color: var(--orbit-ink);
    font-size: 0.88em;
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  }
}

/* IDE 风格工程文件树排版 */
.project-tree {
  margin: 0.4rem 0 0.65rem;
  background: #3b4252;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 4px 18px -2px rgba(11, 41, 37, 0.15);
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 0.79rem;
  line-height: 1.6;
}

.tree-header {
  display: flex;
  align-items: center;
  padding: 0.5rem 0.85rem;
  background: rgba(0, 0, 0, 0.15);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.tree-window-controls {
  display: flex;
  align-items: center;
  gap: 0.35rem;
}

.tree-dot-btn {
  width: 9px;
  height: 9px;
  border-radius: 50%;

  &--red {
    background: #ff5f56;
  }
  &--yellow {
    background: #ffbd2e;
  }
  &--green {
    background: #27c93f;
  }
}

.tree-title {
  color: #ffffff;
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.03em;
}

.tree-badge {
  font-size: 0.65rem;
  font-weight: 600;
  padding: 0.1rem 0.45rem;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.18);
  color: #ffffff;
  border: 1px solid rgba(255, 255, 255, 0.28);
}

.tree-content {
  padding: 0.75rem 0.9rem;
  overflow-x: auto;
  color: #ffffff;
}

.tree-row {
  display: flex;
  align-items: center;
  flex-wrap: nowrap;
  white-space: nowrap;
  gap: 0.45rem;
  padding: 0.22rem 0.4rem;
  border-radius: 4px;
  transition: background-color 0.15s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.12);
  }

  &--root {
    font-weight: 700;
    padding-left: 0.1rem;
    margin-bottom: 0.2rem;
  }

  &--group {
    margin-top: 0.15rem;
  }

  &--sub {
    padding: 0.16rem 0.35rem;
  }
}

.tree-branch {
  color: rgba(255, 255, 255, 0.65);
  user-select: none;
  font-weight: 500;
}

.tree-subgroup {
  padding-left: 1.15rem;
  border-left: 1px dashed rgba(255, 255, 255, 0.35);
  margin-left: 0.8rem;
  margin-top: 0.15rem;
  margin-bottom: 0.25rem;
}

.tree-name {
  font-weight: 600;
  color: #ffffff;

  &--root {
    color: #ffffff;
    font-size: 0.84rem;
  }

  &--group {
    color: #ffffff;
    font-weight: 700;
  }
}

.tree-tags {
  display: inline-flex;
  gap: 0.25rem;
}

.tree-tag {
  font-size: 0.62rem;
  font-weight: 600;
  padding: 0.05rem 0.35rem;
  border-radius: 3px;
  background: rgba(255, 255, 255, 0.2);
  color: #ffffff;
  border: 1px solid rgba(255, 255, 255, 0.35);
  line-height: 1.2;
}

.tree-comment {
  color: #e6edf3;
  font-size: 0.74rem;
  margin-left: 0.25rem;
}

/* Modules Section (Preserved Image #2) */
.modules-section {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.modules-title {
  margin: 0;
  color: var(--orbit-ink);
  font-size: 1.15rem;
  font-weight: 700;
  letter-spacing: -0.01em;
}

.module-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
}

.module-card {
  position: relative;
  display: flex;
  gap: 1.25rem;
  padding: 1.75rem;
  background: var(--orbit-paper);
  border: 1px solid var(--orbit-line-soft);
  border-radius: 14px;
  box-shadow: 0 2px 8px -2px rgba(21, 59, 54, 0.04);
  cursor: pointer;
  outline: none;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);

  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 12px 24px -4px rgba(21, 59, 54, 0.1);
    border-color: rgba(232, 117, 59, 0.4);

    .card-arrow {
      color: var(--orbit-orange);
      transform: translate(2px, -2px);
    }
  }

  &:focus-visible {
    outline: 2px solid var(--orbit-orange);
    outline-offset: 2px;
  }

  &:active {
    transform: scale(0.98);
  }
}

.card-icon-wrap {
  display: grid;
  place-items: center;
  width: 3.2rem;
  height: 3.2rem;
  border-radius: 12px;
  flex-shrink: 0;

  svg {
    width: 1.6rem;
    height: 1.6rem;
  }

  &--orange {
    background: rgba(232, 117, 59, 0.12);
    color: var(--orbit-orange);
  }

  &--teal {
    background: rgba(121, 168, 142, 0.15);
    color: #79a88e;
  }

  &--indigo {
    background: rgba(99, 102, 241, 0.12);
    color: #6366f1;
  }
}

.card-text {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  flex: 1;

  p {
    margin: 0;
    color: var(--orbit-body-muted);
    font-size: 0.88rem;
    line-height: 1.6;
  }
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;

  h3 {
    margin: 0;
    color: var(--orbit-ink);
    font-size: 1.05rem;
    font-weight: 700;
  }
}

.card-arrow {
  color: var(--orbit-body-muted);
  font-size: 1.1rem;
  font-weight: 600;
  transition:
    transform 0.2s ease,
    color 0.2s ease;
}

@media (max-width: 900px) {
  .scaffolds-grid {
    grid-template-columns: 1fr;
    gap: 1.25rem;
  }

  .scaffold-card {
    padding: 1.5rem;
  }

  .scaffolds-intro {
    white-space: normal;
  }
}
</style>
