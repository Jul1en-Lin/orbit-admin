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

            <!-- 技术选型分类展示 -->
            <div class="tech-categorized tech-categorized--purple">
              <div class="tech-category-row">
                <span class="category-name">核心框架</span>
                <div class="category-items">
                  <span class="tech-pill tech-pill--purple">Vue 3</span>
                  <span class="tech-pill tech-pill--purple">Vite</span>
                  <span class="tech-pill tech-pill--purple">TypeScript</span>
                </div>
              </div>

              <div class="tech-category-row">
                <span class="category-name">状态路由</span>
                <div class="category-items">
                  <span class="tech-pill tech-pill--purple">Pinia</span>
                  <span class="tech-pill tech-pill--purple">Vue Router</span>
                </div>
              </div>

              <div class="tech-category-row">
                <span class="category-name">UI组件库</span>
                <div class="category-items">
                  <span class="tech-pill tech-pill--purple">Element Plus</span>
                  <span class="tech-pill tech-pill--purple">Sass / SCSS</span>
                </div>
              </div>

              <div class="tech-category-row">
                <span class="category-name">网络通信</span>
                <div class="category-items">
                  <span class="tech-pill tech-pill--purple">Axios</span>
                  <span class="tech-pill tech-pill--purple">Vite Proxy</span>
                </div>
              </div>

              <div class="tech-category-row">
                <span class="category-name">安全与规范</span>
                <div class="category-items">
                  <span class="tech-pill tech-pill--purple">CryptoJS</span>
                  <span class="tech-pill tech-pill--purple">Prettier</span>
                  <span class="tech-pill tech-pill--purple">Vitest</span>
                </div>
              </div>
            </div>

            <!-- 模块结构与工程树 -->
            <div class="detail-block">
              <div class="detail-badge detail-badge--purple">模块结构与工程树</div>
              <p class="section-lead section-lead--emphasis">
                系统按公共基础底座与核心业务功能解耦分层，采用统一网络契约与响应式状态中枢驱动：
              </p>
              <ol class="contract-steps">
                <li>在 <code>api/</code> 模块中声明标准化业务请求契约与数据模型，由统一网络客户端完成信封解包。</li>
                <li>在 <code>views/</code> 模块中通过响应式组合式 API 驱动页面渲染，具备竞态消除与脏表单防护机制。</li>
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
                    <span class="tree-name tree-name--root">./</span>
                  </div>

                  <!-- 树节点: src -->
                  <div class="tree-row tree-row--group">
                    <span class="tree-branch">├──</span>
                    <span class="tree-name tree-name--group">src/</span>
                    <span class="tree-comment"># 前端核心源码目录</span>
                  </div>

                  <!-- 二级子包列表 -->
                  <div class="tree-subgroup">
                    <div class="tree-row tree-row--sub">
                      <span class="tree-branch">├──</span>
                      <span class="tree-name">api/</span>
                      <span class="tree-comment"># Axios 客户端封装与业务 API 契约声明</span>
                    </div>
                    <div class="tree-row tree-row--sub">
                      <span class="tree-branch">├──</span>
                      <span class="tree-name">auth/</span>
                      <span class="tree-comment"># Pinia 用户状态管理与 CryptoJS 密码加密</span>
                    </div>
                    <div class="tree-row tree-row--sub">
                      <span class="tree-branch">├──</span>
                      <span class="tree-name">router/</span>
                      <span class="tree-comment"># Vue Router 实例配置与受保护路由拦截守卫</span>
                    </div>
                    <div class="tree-row tree-row--sub">
                      <span class="tree-branch">├──</span>
                      <span class="tree-name">views/</span>
                      <span class="tree-comment"># 登录、工作台、账号、字典、参数与 404 视图</span>
                    </div>
                    <div class="tree-row tree-row--sub">
                      <span class="tree-branch">├──</span>
                      <span class="tree-name">components/</span>
                      <span class="tree-comment"># AppShell 布局骨架、毛玻璃顶栏与主导航</span>
                    </div>
                    <div class="tree-row tree-row--sub">
                      <span class="tree-branch">├──</span>
                      <span class="tree-name">styles/</span>
                      <span class="tree-comment"># 深墨绿设计规范与 Element Plus 主题定制</span>
                    </div>
                    <div class="tree-row tree-row--sub">
                      <span class="tree-branch">└──</span>
                      <span class="tree-name">main.ts</span>
                      <span class="tree-comment"># 应用入口、组件全局注册与根实例挂载</span>
                    </div>
                  </div>

                  <!-- 树节点: vite.config.ts -->
                  <div class="tree-row">
                    <span class="tree-branch">├──</span>
                    <span class="tree-name">vite.config.ts</span>
                    <span class="tree-comment"># 开发构建与反向代理跨域配置</span>
                  </div>

                  <!-- 树节点: .env.* -->
                  <div class="tree-row">
                    <span class="tree-branch">├──</span>
                    <span class="tree-name">.env.*</span>
                    <span class="tree-comment"># 开发、预发布与生产多环境变量配置</span>
                  </div>

                  <!-- 树节点: deploy -->
                  <div class="tree-row">
                    <span class="tree-branch">└──</span>
                    <span class="tree-name">deploy/nginx/</span>
                    <span class="tree-comment"># 纯静态托管部署与同源反向代理网关配置</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- 核心业务功能 -->
            <div class="detail-block detail-block--separated">
              <div class="detail-badge detail-badge--purple">核心业务功能</div>
              <div class="feature-list">
                <div class="feature-item">
                  <span class="feature-bullet feature-bullet--purple" />
                  <div class="feature-text">
                    <strong>参数设置</strong>：全局参数热刷新
                    <ol>
                      <li><strong>拦截校验</strong>：校验并拦截纯空格内容，避免写入空配置引发微服务解析异常。</li>
                      <li>
                        <strong>运行时即时生效</strong>：直连微服务参数接口保存配置，微服务读取后即时更新，无需重启。
                      </li>
                      <li>
                        <strong>原生格式支持</strong>：配置框支持原始缩进和换行，支持 JSON、规则串与长文本内容的存储。
                      </li>
                    </ol>
                  </div>
                </div>

                <div class="feature-item">
                  <span class="feature-bullet feature-bullet--purple" />
                  <div class="feature-text">
                    <strong>字典管理</strong>：维护通用业务标签
                    <ol>
                      <li>
                        <strong>类型与字典项分层</strong>：按类型与数据值两层维护，支持从类型列表下钻配置具体枚举项。
                      </li>
                      <li>
                        <strong>表单交互对齐</strong
                        >：结合后端字段约束，在前端校验拦截非法清空等操作，避免产生无意义的报错请求。
                      </li>
                    </ol>
                  </div>
                </div>

                <div class="feature-item">
                  <span class="feature-bullet feature-bullet--purple" />
                  <div class="feature-text">
                    <strong>登录与认证</strong>：账号登录和初始化会话流程
                    <ol>
                      <li>
                        <strong>密码加密传输</strong>：提交前使用 AES
                        对称加密密码，与后端解密逻辑对齐，避免明文在链路中传输。
                      </li>
                      <li>
                        <strong>重定向地址过滤</strong
                        >：登录成功后跳转到来源页面时，只允许站内相对路径，过滤双斜杠等异常地址，防止跳往外部钓鱼站点。
                      </li>
                      <li>
                        <strong>提交防重与状态复位</strong
                        >：登录请求期间锁定按钮，防止连击重复提交；请求返回或发生异常后均能复位加载状态，并给出对应提示。
                      </li>
                    </ol>
                  </div>
                </div>

                <div class="feature-item">
                  <span class="feature-bullet feature-bullet--purple" />
                  <div class="feature-text">
                    <strong>用户管理</strong>：账号维护与操作防护
                    <ol>
                      <li>
                        <strong>数据提交与刷新分离</strong
                        >：数据保存成功但后续自动刷新列表失败时，主动提示已保存成功并打断操作，避免误判重复提交。
                      </li>
                      <li>
                        <strong>查询序号防乱序</strong
                        >：进行检索和分页查询时携带唯一自增序号，只采用最新发出的请求响应，丢弃迟到的旧响应，避免慢请求覆盖快请求。
                      </li>
                    </ol>
                  </div>
                </div>
              </div>
            </div>

            <!-- 基础组件库 -->
            <div class="detail-block detail-block--separated">
              <div class="detail-badge detail-badge--purple">基础组件库</div>
              <div class="feature-list">
                <div class="feature-item">
                  <span class="feature-bullet feature-bullet--purple" />
                  <div class="feature-text">
                    <strong>工程规范与格式化</strong>
                    <ol>
                      <li>
                        <strong>自动化校验</strong>：配置格式检查与一键修复脚本，与 ESLint 协同保证提交代码的整洁一致。
                      </li>
                      <li>
                        <strong>统一代码风格</strong>：通过 Prettier
                        约束单引号、无分号与行宽等排版规则，避免多人协作时产生无意义的格式差异与 Git 冲突。
                      </li>
                    </ol>
                  </div>
                </div>

                <div class="feature-item">
                  <span class="feature-bullet feature-bullet--purple" />
                  <div class="feature-text">
                    <strong>静态部署与反向代理</strong>
                    <ol>
                      <li>
                        <strong>网关反向代理</strong>：统一将
                        <code>/api</code> 代理到后端网关，开发环境与生产环境均无需额外处理浏览器跨域限制。
                      </li>
                      <li>
                        <strong>路由回退</strong>：Nginx 配置所有路径回退到入口文件，入口 HTML
                        设置不缓存，保证发版后及时拿到新资源。
                      </li>
                    </ol>
                  </div>
                </div>

                <div class="feature-item">
                  <span class="feature-bullet feature-bullet--purple" />
                  <div class="feature-text">
                    <strong>路由拦截与权限控制</strong>
                    <ol>
                      <li>
                        <strong>已登录防重跳</strong>：已处于登录状态的用户访问登录页时，自动跳往工作台，避免重复登录。
                      </li>
                      <li>
                        <strong>受保护路由拦截</strong
                        >：页面配置鉴权标记后，未登录用户访问会被拦截并导向登录页，同时记录来源地址用于登录后回跳。
                      </li>
                    </ol>
                  </div>
                </div>

                <div class="feature-item">
                  <span class="feature-bullet feature-bullet--purple" />
                  <div class="feature-text">
                    <strong>网络请求封装</strong>
                    <ol>
                      <li>
                        <strong>统一信封解包</strong
                        >：拦截器自动校验业务状态码，正常时直接解出数据对象交给业务层，简化调用方逻辑。
                      </li>
                      <li>
                        <strong>错误分类处理</strong>：统一捕获业务未通过、HTTP
                        状态错误、接口超时和网络中断等四类异常，输出格式化的错误信息。
                      </li>
                    </ol>
                  </div>
                </div>

                <div class="feature-item">
                  <span class="feature-bullet feature-bullet--purple" />
                  <div class="feature-text">
                    <strong>会话恢复与持久化</strong>
                    <ol>
                      <li>
                        <strong>状态持久化同步</strong>：在状态仓库中维护 Token 与用户信息，同步到浏览器本地存储。
                      </li>
                      <li>
                        <strong>并发恢复去重</strong>：页面刷新或路由拦截同时触发会话恢复时，合并复用同一个在途
                        Promise，避免重复请求个人信息接口。
                      </li>
                    </ol>
                  </div>
                </div>
              </div>
            </div>
          </article>

          <!-- 后端脚手架卡片 -->
          <article class="scaffold-card scaffold-card--backend">
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
                <li>在 <code>*-service</code> 模块的 Controller 中直接实现对应的 <code>FeignClient</code> 接口。</li>
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
                    <span class="tree-name tree-name--root">./</span>
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
                        <strong>参数服务</strong
                        >：系统运行时支持动态配置各种参数，微服务按配置键实时读取全局参数，减少业务常量硬编码。
                      </li>
                      <li>
                        <strong>字典服务</strong>：维护字典类型与字典数据项。除后台基础增删改查外，对外提供 Feign
                        接口远程调用，支持单类型查询、多类型批量查询以及按 key 获取字典项功能。
                      </li>
                      <li>
                        <strong>用户管理</strong>：统一管理 B 端管理员与 C
                        端用户档案。手机号入库前进行对称加密存储，登录密码支持前端密文传输并在后端加盐校验比对，支持账号禁用与状态流转控制。
                      </li>
                      <li>
                        <strong>地图与区划服务</strong
                        >：内置全国省市区三级行政区划数据，支持多层级查询、热门城市以及城市拼音首字母（A~Z）索引归类；服务启动时自动对城市区划数据进行两级缓存预热，减少启动时的首次访问负担。同时集成第三方腾讯地图服务，实现
                        POI 关键词搜索和经纬度逆地址解析。
                      </li>
                    </ol>
                  </div>
                </div>

                <div class="feature-item">
                  <span class="feature-bullet feature-bullet--teal" />
                  <div class="feature-text">
                    <strong>业务微服务工程模板</strong>：为新创建的业务微服务提供标准参考工程，分为 api 接口与 service
                    实现模块
                    <ol>
                      <li>
                        <strong>核心功能支持</strong
                        >：内置两级缓存读写与回填、异步线程池任务调度，以及消息队列生产消费与监听处理的完整示例。
                      </li>
                      <li>
                        <strong>预置配置</strong
                        >：包含服务注册发现、集中式配置读取、数据库持久化及代码分层规范，复制工程即可快速开启新业务开发。
                      </li>
                    </ol>
                  </div>
                </div>

                <div class="feature-item">
                  <span class="feature-bullet feature-bullet--teal" />
                  <div class="feature-text">
                    <strong>对象存储服务</strong>：提供统一的文件存储抽象接口，屏蔽底层云厂商 SDK
                    封装细节，当前对接阿里云 OSS
                    <ol>
                      <li><strong>文件访问与预览</strong>：提供带签名或公网地址的文件路径拼装，可直接访问下载。</li>
                      <li>
                        <strong>后端中继上传</strong>：微服务接收文件输入流，生成 UUID 路径前缀保证文件不重名，调用
                        OSSClient 上传，并设置公共读权限。
                      </li>
                      <li>
                        <strong>前端直传 V4 签名</strong>：服务端根据阿里云 OSS V4
                        签名规范生成临时授权凭证，前端拿此凭据直接向 OSS
                        提交文件，文件上传过程不经过应用网关，节省服务端带宽。
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
                        <strong>解耦</strong>：通过 Feign
                        远程调用用户与配置接口，实现前台业务流程与后台数据处理/存储解耦。
                      </li>
                    </ol>
                  </div>
                </div>

                <div class="feature-item">
                  <span class="feature-bullet feature-bullet--teal" />
                  <div class="feature-text">
                    <strong>网关服务</strong>：基于 WebFlux 响应式架构构建，统一处理外部请求的路由调度与安全拦截
                    <ol>
                      <li><strong>白名单机制</strong>：读取无需鉴权的路径清单，匹配成功直接放行。</li>
                      <li>
                        <strong>网关异常处理</strong>：捕获网关阶段抛出的路由未找到、服务离线及鉴权失败等异常，按统一的
                        Result 结构直接写回 JSON 报文，保证返回前端的结果一致。
                      </li>
                      <li>
                        <strong>统一鉴权与状态校验</strong>：拦截请求并解析 Token 令牌凭证，校验签名有效性，并联动 Redis
                        校验用户登录态是否过期。鉴权通过后自动将用户信息保留，传给下游业务微服务，使下游服务无需编写重复的鉴权代码。
                      </li>
                    </ol>
                  </div>
                </div>
              </div>
            </div>

            <!-- 基础组件库 -->
            <div class="detail-block detail-block--separated">
              <div class="detail-badge detail-badge--teal">基础组件库</div>
              <div class="feature-list">
                <div class="feature-item">
                  <span class="feature-bullet feature-bullet--teal" />
                  <div class="feature-text">
                    <strong>核心工具与异步线程池</strong>
                    <ol>
                      <li>
                        <strong>基础工具支持</strong>：集成敏感数据对称加解密、JSON
                        序列化与复杂对象转换、对象属性复制及通用分页工具。
                      </li>
                      <li>
                        <strong>异步线程池策略管理</strong>：通过 nacos
                        服务提供参数外部化配置的异步线程池，支持拒绝策略切换和容器关闭时等待在途任务执行完毕。
                      </li>
                    </ol>
                  </div>
                </div>

                <div class="feature-item">
                  <span class="feature-bullet feature-bullet--teal" />
                  <div class="feature-text">
                    <strong>两级缓存基础服务</strong>
                    <ol>
                      <li>
                        <strong>本地与分布式缓存协同</strong>：结合 Caffeine 本地高性能内存缓存与 Redis
                        分布式缓存。读取数据时优先查本地缓存，未命中时查分布式缓存并自动回填本地，双层均未命中才访问源数据库，减轻热点数据对分布式缓存和数据库的访问压力。
                      </li>
                    </ol>
                  </div>
                </div>

                <div class="feature-item">
                  <span class="feature-bullet feature-bullet--teal" />
                  <div class="feature-text">
                    <strong>分布式锁与 Redis 服务</strong>
                    <ol>
                      <li><strong>Redis 基础操作</strong>：提供标准化常用键值、哈希、列表等数据结构操作。</li>
                      <li>
                        <strong>分布式锁与自动续期</strong
                        >：基于分布式锁机制实现跨服务并发互斥，内置看门狗自动续期逻辑，防止因耗时业务导致锁提前超时释放，并约束锁由持有线程安全释放。
                      </li>
                    </ol>
                  </div>
                </div>

                <div class="feature-item">
                  <span class="feature-bullet feature-bullet--teal" />
                  <div class="feature-text">
                    <strong>消息队列标准化配置</strong>
                    <ol>
                      <li>
                        <strong>时间格式归一</strong
                        >：统一消息体中的日期时间为标准字符串格式，保障消息生产与消费解析的一致性。
                      </li>
                      <li>
                        <strong>统一消息序列化</strong>：采用标准 JSON
                        格式进行消息序列化与反序列化，规避二进制序列化的版本与跨平台兼容问题。
                      </li>
                    </ol>
                  </div>
                </div>

                <div class="feature-item">
                  <span class="feature-bullet feature-bullet--teal" />
                  <div class="feature-text">
                    <strong>统一令牌与会话管理</strong>
                    <ol>
                      <li>
                        <strong>异步线程池管理</strong>：通过 nacos 提供参数外部化配置的线程池，支持拒绝策略热切换。
                      </li>
                      <li>
                        <strong>凭证校验</strong>：负责生成包含用户信息的无状态令牌，在 Redis
                        中同步记录会话有效期；新登录时支持自动更新旧状态，实现单设备互斥登录。
                      </li>
                    </ol>
                  </div>
                </div>

                <div class="feature-item">
                  <span class="feature-bullet feature-bullet--teal" />
                  <div class="feature-text">
                    <strong>统一响应与异常处理</strong>
                    <ol>
                      <li><strong>全局异常拦截</strong>：支持统一拦截业务自定义异常等多种系统级错误。</li>
                      <li>
                        <strong>分层错误码设计</strong>：采用 6 位全局错误码，前 3 位映射标准 HTTP 状态码，后 3
                        位标识具体业务原因。
                      </li>
                      <li>
                        <strong>统一响应规范</strong>：统一采用标准的响应报文结构，包含状态码、提示信息和业务数据，并将
                        HTTP 响应状态码同步更新为错误码前 3 位。
                      </li>
                    </ol>
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

  &--purple {
    background: rgba(186, 181, 219, 0.08);
    border-color: rgba(186, 181, 219, 0.25);
  }
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
  margin: -0.65rem 0 0.6rem;
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
