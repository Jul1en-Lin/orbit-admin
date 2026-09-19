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
          <article class="scaffold-card">
            <div class="card-head">
              <div class="card-tag card-tag--orange">
                <span class="tag-dot" />
                <span>前端脚手架</span>
              </div>
              <span class="scaffold-name">Orbit Admin</span>
            </div>

            <div class="card-main">
              <div class="scaffold-icon scaffold-icon--orange">
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
              <span class="tech-pill">Vue</span>
              <span class="tech-pill">Vite</span>
              <span class="tech-pill">TypeScript</span>
              <span class="tech-pill">Pinia</span>
              <span class="tech-pill">Vue Router</span>
              <span class="tech-pill">Element Plus</span>
              <span class="tech-pill">Axios</span>
            </div>

            <!-- 公共基础部分 -->
            <div class="detail-block">
              <div class="detail-badge detail-badge--orange">公共基础部分</div>
              <div class="feature-list">
                <div class="feature-item">
                  <span class="feature-bullet feature-bullet--orange" />
                  <div class="feature-text">
                    <strong>工程基线</strong>：Vue + Vite + Element Plus 标准工程，按需集成组件并注入深墨绿设计规范。
                  </div>
                </div>
                <div class="feature-item">
                  <span class="feature-bullet feature-bullet--orange" />
                  <div class="feature-text">
                    <strong>网络底座</strong>：Pinia + Axios 统一客户端，解包 <code>Result&lt;T&gt;</code>，基于
                    <code>sessionSeq</code> 隔离晚到响应与并发 401 收敛。
                  </div>
                </div>
                <div class="feature-item">
                  <span class="feature-bullet feature-bullet--orange" />
                  <div class="feature-text">
                    <strong>路由守卫</strong>：Vue Router
                    纯静态路由回退、受保护路由拦截、登录态静默恢复与防越权安全重定向。
                  </div>
                </div>
                <div class="feature-item">
                  <span class="feature-bullet feature-bullet--orange" />
                  <div class="feature-text">
                    <strong>安全防串序</strong>：CryptoJS AES 密码传输加密对齐后端，单调递增
                    <code>querySeq</code> 彻底消除异步查询相互覆盖。
                  </div>
                </div>
              </div>
            </div>

            <!-- 公共业务部分 -->
            <div class="detail-block detail-block--separated">
              <div class="detail-badge detail-badge--orange">公共业务部分</div>
              <div class="feature-list">
                <div class="feature-item">
                  <span class="feature-bullet feature-bullet--orange" />
                  <div class="feature-text">
                    <strong>登录页</strong>：账号密码表单校验、AES
                    密文加密通信、防重复提交互斥锁与失效感知平滑重试降级。
                  </div>
                </div>
                <div class="feature-item">
                  <span class="feature-bullet feature-bullet--orange" />
                  <div class="feature-text">
                    <strong>布局页</strong>：AppShell 毛玻璃吸顶顶栏骨架、品牌工作台跳转、主导航指示器及一键安全退出。
                  </div>
                </div>
                <div class="feature-item">
                  <span class="feature-bullet feature-bullet--orange" />
                  <div class="feature-text">
                    <strong>用户管理</strong>：平台账号检索、字典动态映射驱动、超时未确认防重复提交与脏表单防丢失。
                  </div>
                </div>
                <div class="feature-item">
                  <span class="feature-bullet feature-bullet--orange" />
                  <div class="feature-text">
                    <strong>系统管理</strong>：字典类型分页与同构增改、字典项维护；参数精准匹配与多行文本灵活配置。
                  </div>
                </div>
                <div class="feature-item">
                  <span class="feature-bullet feature-bullet--orange" />
                  <div class="feature-text">
                    <strong>错误页</strong>：404 未定义路径全匹配捕获、深墨绿视觉轨道呈现与一键安全返回管理端工作台。
                  </div>
                </div>
              </div>
            </div>
          </article>

          <!-- 后端脚手架卡片 -->
          <article class="scaffold-card">
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
                <p class="card-subtitle">企业级高内聚微服务基础架构与微服务工程模板基线</p>
              </div>
            </div>

            <p class="card-desc">
              基于 Java 与 SpringBoot 构建的高内聚微服务后端底座。内置响应式 API
              网关、B/C端核心支撑中台、统一文件存储抽象与新微服务开发脚手架模板，确立统一 Result
              响应模型与编译期强制一致的 OpenFeign 接口继承契约。
            </p>

            <div class="tech-pills">
              <span class="tech-pill tech-pill--teal">Java</span>
              <span class="tech-pill tech-pill--teal">SpringBoot</span>
              <span class="tech-pill tech-pill--teal">Spring Cloud</span>
              <span class="tech-pill tech-pill--teal">Nacos</span>
              <span class="tech-pill tech-pill--teal">Gateway</span>
              <span class="tech-pill tech-pill--teal">OpenFeign</span>
              <span class="tech-pill tech-pill--teal">MyBatis-Plus</span>
              <span class="tech-pill tech-pill--teal">Redis</span>
              <span class="tech-pill tech-pill--teal">Redisson</span>
              <span class="tech-pill tech-pill--teal">Caffeine</span>
            </div>

            <div class="detail-block">
              <div class="detail-badge detail-badge--teal">微服务模块矩阵</div>
              <div class="feature-list">
                <div class="feature-item">
                  <span class="feature-bullet feature-bullet--teal" />
                  <div class="feature-text">
                    <strong>网关与安全鉴权</strong>：<code>lien-gateway</code> 基于 WebFlux 响应式模型，集成白名单、JWT
                    验签与 Redis 登录态双重校验，向下游微服务 Header 注入身份上下文。
                  </div>
                </div>
                <div class="feature-item">
                  <span class="feature-bullet feature-bullet--teal" />
                  <div class="feature-text">
                    <strong>中台管理服务</strong>：<code>lien-admin</code> 提供系统人员管理（手机号 AES
                    密文合规入库、密码散列）、数据字典中心（支持批量 Feign 查询）、系统参数配置与腾讯地图 POI
                    逆地址解析。
                  </div>
                </div>
                <div class="feature-item">
                  <span class="feature-bullet feature-bullet--teal" />
                  <div class="feature-text">
                    <strong>C端微服务门户</strong>：<code>lien-portal</code> 面向移动端与 C
                    端用户业务，封装微信授权登录与用户基础资料管理，通过 OpenFeign 声明式调用中台基础能力。
                  </div>
                </div>
                <div class="feature-item">
                  <span class="feature-bullet feature-bullet--teal" />
                  <div class="feature-text">
                    <strong>对象存储与服务模板</strong>：<code>lien-file</code> 抽象存储接口并集成阿里云 OSS
                    SDK（支持后端中继与前端 V4 直传签名）；<code>lien-mstemplate</code>
                    提供一键克隆的新业务微服务标准工程模板。
                  </div>
                </div>
              </div>
            </div>

            <div class="detail-block detail-block--separated">
              <div class="detail-badge detail-badge--teal">核心底座架构能力</div>
              <div class="feature-list">
                <div class="feature-item">
                  <span class="feature-bullet feature-bullet--teal" />
                  <div class="feature-text">
                    <strong>契约规范与异常映射</strong>：全链路标准化统一 <code>Result&lt;T&gt;</code>、6 位
                    <code>EnumCode</code>（前 3 位精准对齐 HTTP 状态码）；Controller 编译期实现 Feign 契约接口，消除 RPC
                    接口与文档脱节。
                  </div>
                </div>
                <div class="feature-item">
                  <span class="feature-bullet feature-bullet--teal" />
                  <div class="feature-text">
                    <strong>两级缓存与分布式锁</strong>：<code>lien-common-cache</code> 封装 L1 本地 (Caffeine) + L2
                    分布式 (Redis) 两级缓存；Redisson 看门狗分布式锁，深度防击穿雪崩。
                  </div>
                </div>
                <div class="feature-item">
                  <span class="feature-bullet feature-bullet--teal" />
                  <div class="feature-text">
                    <strong>基础设施共享与环境隔离</strong>：基于 Nacos 动态配置中心，结合 <code>bootstrap</code> 挂载
                    Redis、MySQL、Caffeine、RabbitMQ 等多微服务共享配置。
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
    border-color: rgba(232, 117, 59, 0.3);
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

  &--orange {
    background: rgba(232, 117, 59, 0.12);
    color: var(--orbit-orange);
    border: 1px solid rgba(232, 117, 59, 0.25);
  }

  &--teal {
    background: rgba(20, 184, 166, 0.12);
    color: #0d9488;
    border: 1px solid rgba(20, 184, 166, 0.25);
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

  &--orange {
    background: rgba(232, 117, 59, 0.12);
    color: var(--orbit-orange);
  }

  &--teal {
    background: rgba(20, 184, 166, 0.12);
    color: #0d9488;
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

.tech-pill {
  padding: 0.2rem 0.55rem;
  border-radius: 6px;
  font-size: 0.72rem;
  font-weight: 600;
  background: rgba(232, 117, 59, 0.08);
  color: var(--orbit-orange);
  border: 1px solid rgba(232, 117, 59, 0.2);

  &--teal {
    background: rgba(20, 184, 166, 0.08);
    color: #0d9488;
    border-color: rgba(20, 184, 166, 0.2);
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

  &--orange {
    background: rgba(232, 117, 59, 0.12);
    color: var(--orbit-orange);
    border: 1px solid rgba(232, 117, 59, 0.25);
  }

  &--teal {
    background: rgba(20, 184, 166, 0.12);
    color: #0d9488;
    border: 1px solid rgba(20, 184, 166, 0.25);
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

  &--orange {
    background: var(--orbit-orange);
  }

  &--teal {
    background: #0d9488;
  }
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
    background: rgba(20, 184, 166, 0.12);
    color: #0d9488;
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
