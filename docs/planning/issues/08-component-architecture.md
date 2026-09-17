---
id: component-architecture
title: 确定组件边界、目录组织与主题复用约定
parent: orbit-map
labels: ["wayfinder:grilling"]
status: closed
assignee: lien
order: 8
blocked_by: [component-choice]
---

## Question

在已选择 Element Plus + 自定义布局与主题的前提下，页面、布局、通用组件和业务组件如何划分与组织？哪些组件直接使用 Element Plus，哪些需要封装？主题变量、SCSS 与局部样式的职责如何划分，如何让下拉和弹窗等浮层得到一致主题，并避免复制模板后的样式耦合与过度抽象？只确定约定，不实现正式组件。

## Context

- [组件选型与验收底线](../comments/component-choice.md)
- [主题与交互能力研究](../assets/component-feasibility.md)
- 具体工具与版本锁定由[确定首版工程工具与质量门槛](05-engineering.md)处理。

## Resolution

见[组件边界、目录组织与主题复用约定的最终决策](../comments/component-architecture.md)。
