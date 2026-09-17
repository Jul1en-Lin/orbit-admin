# Element Plus 对 B 顶栏分栏工作台的可行性研究

- 议题：[component-feasibility](../issues/07-component-feasibility.md)
- 研究范围：Vue 3 + TypeScript + SCSS 下，用 Element Plus 承担账号列表、筛选表单、新增弹窗的交互；页面布局、品牌与视觉由应用 CSS 实现。
- 证据：仅 Element Plus 官方文档及其官方 GitHub 源码（链接见各项）。源码链接指向 `dev`，发布版本必须在锁定依赖版本后复核。
- **未实测**：本研究没有安装、编译或运行 Element Plus，也没有做浏览器、键盘、屏幕阅读器或正式 a11y 验证；下文的键盘/焦点结论是文档与源码层面的判断，不是验收结论。

## 结论

**可行，未发现硬障碍。** 已选 B 方案的深墨绿顶栏、暖白正文、橙色主操作、细线分区、衬线标题、右侧说明栏和高密度账号表格都属于应用布局与样式的控制范围；不需要改造或替换组件库。建议由应用自行实现 `top`、`split`、`rail`、品牌标题和说明文案，以 `ElTable`、`ElForm`/`ElFormItem`、`ElInput`、`ElSelect`、`ElDialog` 承担已有的列表、筛选、新增表单交互。原型 B 的视觉基准见 [原型源码](../prototypes/admin-visual/index.html)。

该判断以「控件细节可适配、不逐像素复刻」为前提，符合已确认标准中的“自写布局，成熟组件承担表格、表单和弹窗”。[选型标准](../comments/component-choice.md)

## 视觉与主题边界

- Element Plus 允许在 CSS 中覆盖 `--el-color-primary` 等 CSS custom properties；官方示例还建议将覆盖限定在应用类名下，而非一律写入 `:root`。因此可将深墨绿、暖白、橙色、边框和状态色映射为应用 token，再在 B 工作台根元素覆写相应 `--el-*` token；原型的布局、衬线标题和分栏线仍应保留为应用 CSS。来源：[Theming · CSS variables](https://element-plus.org/en-US/guide/theming.html)。
- 若需要让组件派生色（例如 primary 的 light/dark 级别）随设计 token 在构建时生成，官方支持通过 `@forward .../theme-chalk/src/common/var.scss with (...)` 覆写 Sass map，并要求在 Element Plus 样式之前导入自定义 SCSS。来源：[Theming · SCSS variables](https://element-plus.org/en-US/guide/theming.html)、[官方 `var.scss`](https://github.com/element-plus/element-plus/blob/dev/packages/theme-chalk/src/common/var.scss)。
- CSS variables 是运行时/局部皮肤的合适手段；SCSS 是构建时生成派生值的手段。后者不会因运行时更改 CSS variable 而重新计算 Sass 派生色，这是两种机制的边界，而非 B 方案的障碍。
- 深色模式若采用 Element Plus 的 dark token，官方要求导入 dark CSS variables；若视觉只使用 B 的自定义深色工作台，则应在工作台作用域明确覆写需要的 token，并实测弹窗遮罩、下拉浮层及禁用/错误状态的对比度。来源：[Dark Mode](https://element-plus.org/en-US/guide/dark-mode.html)。**尚未实测对比度。**

## 表格与表单的适配

- 原型中的账号目录可用 `ElTable`：官方 API 提供列、slot、`cell-style`、`header-cell-style`、`row-style` 和 `header-row-style` 等定制入口，足以实现暖白文本、细分隔线、紧凑表头、状态标签和备注列；必要时状态单元格由 column slot 渲染。来源：[Table attributes](https://element-plus.org/en-US/component/table.html#table-attributes)、[Table column attributes](https://element-plus.org/en-US/component/table.html#table-column-attributes)、[Table slots](https://element-plus.org/en-US/component/table.html#table-slots)。
- 原型的筛选与新增字段可由 `ElForm`、`ElFormItem`、`ElInput`、`ElSelect` 组合，并由应用的 TS 表单模型、校验规则和提交状态控制。`ElForm` 支持校验、`validate`、`resetFields`、`scrollToField`；`scroll-to-error` 默认关闭。来源：[Form attributes/exposes](https://element-plus.org/en-US/component/form.html#form-attributes)、[官方 `form.ts`](https://github.com/element-plus/element-plus/blob/dev/packages/components/form/src/form.ts)。
- 限制：表单的 `scroll-to-error`/`scrollToField` 是滚动能力，不能据此声称首个无效控件会被聚焦；若产品要求该行为，应用须持有具体控件 ref 后显式调用控件的 focus API。此为源码/API 范围判断，**未做浏览器验证**。
- 限制：Table 提供 `scrollbar-tabindex`，而官方源码的表格 body 使用 `tabindex="-1"`；源码中没有给普通行/单元格配置 roving tabindex 或行间箭头键处理。因此 B 原型所需的普通只读表格没有问题，但若以后把整行或单元格做成可操作目标，必须由应用定义并测试键盘模型，不应假定 ElTable 已提供网格式箭头导航。来源：[Table attributes](https://element-plus.org/en-US/component/table.html#table-attributes)、[官方 table defaults](https://github.com/element-plus/element-plus/blob/dev/packages/components/table/src/table/defaults.ts)、[官方 table body](https://github.com/element-plus/element-plus/blob/dev/packages/components/table/src/table-body/index.ts)。

## Select、Dialog 与基本键盘路径

- `ElSelect` 的内部输入框默认 `tabindex="0"`，使用 `role="combobox"` 与 `aria-expanded`、`aria-activedescendant`；组件公开 `focus()` 和 `blur()`。官方源码处理 Arrow Up/Down、Enter、Escape、Home/End、PageUp/PageDown，并跳过不可用或不可见选项。故原型中“状态、身份下拉可用键盘操作”的基础要求有组件依据。来源：[Select attributes](https://element-plus.org/en-US/component/select.html#select-attributes)、[Select exposes](https://element-plus.org/en-US/component/select.html#select-exposes)、[官方 `select.vue`](https://github.com/element-plus/element-plus/blob/dev/packages/components/select/src/select.vue)、[官方 `useSelect.ts`](https://github.com/element-plus/element-plus/blob/dev/packages/components/select/src/useSelect.ts)。
- 这不等同于已验证所有读屏器或浏览器：尤其是 Tab 离开下拉、筛选模式、远程数据、禁用项和校验错误提示必须在实际页面测试。源码的键盘处理范围也不应被扩展解读为完整无障碍认证。
- `ElDialog` 的 `close-on-press-escape` 默认 `true`，并提供 `open-auto-focus` 与 `close-auto-focus` 生命周期事件。其源码将可见对话框包在 loop 模式的 `ElFocusTrap` 中；focus trap 源码处理 Tab/Shift+Tab 边界循环。来源：[Dialog attributes](https://element-plus.org/en-US/component/dialog.html#attributes)、[Dialog events](https://element-plus.org/en-US/component/dialog.html#events)、[官方 `dialog.vue`](https://github.com/element-plus/element-plus/blob/dev/packages/components/dialog/src/dialog.vue)、[官方 `focus-trap.vue`](https://github.com/element-plus/element-plus/blob/dev/packages/components/focus-trap/src/focus-trap.vue)。
- focus trap 的 release 路径会尝试恢复 trap 建立前记录的焦点；目标不可用时源码可回退到 `document.body`。所以“弹窗关闭后焦点返回”具备实现基础，但不能保证在触发按钮被卸载、禁用或页面重渲染时仍回到**该按钮**。应在 B 页面保留触发按钮，并在 `close-auto-focus` 场景实测；必要时由应用记录触发元素并显式 `.focus()`。来源：[官方 focus-trap implementation](https://github.com/element-plus/element-plus/blob/dev/packages/components/focus-trap/src/focus-trap.vue)、[官方 focus-trap tests](https://github.com/element-plus/element-plus/blob/dev/packages/components/focus-trap/__tests__/focus-trap.test.ts)。**尚未进行焦点恢复或 focus trap 的实际验证。**

## Vue 3 与 TypeScript

- Element Plus 是 Vue 3 组件库；官方 Quick Start 使用 Vue 3 安装方式，官方示例使用 `<script setup lang="ts">`。对于 Volar，官方给出在 `tsconfig.json` 加入 `element-plus/global` 的类型配置。来源：[Quick Start](https://element-plus.org/en-US/guide/quickstart.html)。
- 官方包元数据声明 Vue 3 peer dependency 并导出 TypeScript declaration；因此“Vue 3 + TypeScript”与本议题的技术前提相容。来源：[官方 package metadata](https://github.com/element-plus/element-plus/blob/dev/packages/element-plus/package.json)。**未在本仓库安装或编译验证具体版本组合。**

## 采用条件与后续实测清单

采用 Element Plus 不需要展开替代库比较。进入正式实现前，锁定 Element Plus/Vue 版本后应至少实测：

1. B 工作台作用域中的 CSS variable 与 SCSS 导入顺序，以及 Table、Select 下拉层和 Dialog 遮罩在深色视觉中的实际颜色/层级；
2. Tab 顺序、可见焦点、Select 的打开/选项选择/离开路径；
3. Dialog 的 Escape、Tab 与 Shift+Tab 循环、取消/保存关闭后的触发元素焦点恢复，以及触发元素被重新渲染时的降级行为；
4. 表单校验错误的提示、滚动与明确聚焦策略；
5. 窄视口下表格横向滚动与右侧说明栏折叠后的键盘可达性和视觉对比度。

这些是实施后的验证项；本文件不将它们标记为已完成，也不主张完成 a11y 验证。
