# 智能云图库管理系统 - 前端

基于 Vue 3 + TypeScript 开发的智能云图库管理系统前端，配合 Spring Boot 后端实现图片上传、管理、检索及私人空间等功能。

项目采用前后端分离架构，前端负责页面交互与数据展示，后端负责业务处理、数据管理及图片云端存储。

## 技术栈

- Vue 3
- TypeScript
- Vite
- Ant Design Vue
- Pinia
- Vue Router
- Axios

## 主要功能

- 用户注册、登录及个人信息展示
- 公共图库浏览、搜索和分类筛选
- 图片上传、编辑、删除及详情查看
- 图片批量创建
- 图片管理及管理员审核
- 私人空间创建与图片管理

## 本地运行

**1. 安装依赖**

```bash
npm install
```

**2. 启动开发环境**

```bash
npm run dev
```

**3. 访问项目**

```text
http://localhost:5173
```

运行前请确保后端服务已经启动，并正确配置前端 API 请求地址。

## 后端项目

本项目为智能云图库管理系统的前端部分。

后端基于 Java 11、Spring Boot 2.7、MyBatis-Plus、MySQL、Redis 和腾讯云 COS 实现，提供用户认证、图片上传、数据管理及云端存储等功能。

后端 GitHub 仓库：

https://github.com/ZiMing929/picture-backend

## 项目说明

本项目用于个人学习与全栈开发实践，主要涉及 Vue 3 前端开发、组件化设计、状态管理、前后端接口交互以及图片资源管理。