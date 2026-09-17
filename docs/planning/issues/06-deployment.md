---
id: deployment-boundary
title: 确定前端独立部署与环境配置边界
parent: orbit-map
labels: ["wayfinder:grilling"]
status: closed
assignee: lien
order: 6
blocked_by: []
---

## Question

现有网关访问方式、白名单及环境约束下，开发代理、生产 API 入口、静态资源与 history 回退、环境变量如何安排？区分开发代理与生产部署，明确浏览器可见配置不得包含服务端秘密。先查可访问的配置事实，再向用户确认部署取舍；缺少环境访问条件时创建必要的 task 议题，不修改后端或共享基础设施。

## Resolution

见[部署方向讨论记录与最终决策](../comments/deployment-boundary.md)。部署方案已确认；实际网关配置核实保留为实现与联调前置任务，不阻塞本议题关闭。
